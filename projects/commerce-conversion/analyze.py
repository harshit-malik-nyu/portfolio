"""Retailrocket descriptive analytics. Stdlib only; no external services required for sample."""
import argparse
import csv
import hashlib
import json
import math
from pathlib import Path
import sqlite3
import tempfile
from datetime import datetime, timezone
ROOT=Path(__file__).resolve().parent


def digest(path):
    h=hashlib.sha256()
    with open(path,'rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
    return h.hexdigest()


def wilson(k,n):
    if not n:return None
    z=1.959963984540054;p=k/n;d=1+z*z/n
    m=(p+z*z/(2*n))/d;h=z*math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d
    return [max(0,m-h),min(1,m+h)]


def load(db,path,gap):
    db.execute('CREATE TABLE raw(ts INTEGER,visitor INTEGER,event TEXT,item INTEGER,transaction_id INTEGER)')
    with open(path,newline='') as f:
        r=csv.DictReader(f);batch=[]
        for row in r:
            if row['event'] not in ('view','addtocart','transaction'):raise ValueError('Unknown event')
            rec=(int(row['timestamp']),int(row['visitorid']),row['event'],int(row['itemid']),int(row['transactionid']) if row['transactionid'] else None)
            batch.append(rec)
            if len(batch)==50000:db.executemany('INSERT INTO raw VALUES (?,?,?,?,?)',batch);batch=[]
        if batch:db.executemany('INSERT INTO raw VALUES (?,?,?,?,?)',batch)
    db.commit()
    # SQL file has one named parameter, validated as an integer timeout.
    if gap<=0:raise ValueError('Session gap must be positive')
    db.executescript((ROOT/'sql/model.sql').read_text().replace(':gap',str(int(gap*60000))))


def records(db,q):
    c=db.execute(q);return [dict(zip([d[0] for d in c.description],row)) for row in c]


def funnel(db,where='1=1'):
    r=records(db,f'''SELECT count(*) sessions,sum(view_ts IS NOT NULL) viewed,
     sum(cart_ts IS NOT NULL) cart_after_view,sum(purchase_ts IS NOT NULL) purchase_after_cart,
     sum(any_cart_ts IS NOT NULL) any_cart,sum(after_cart_ts IS NOT NULL) direct_cart_purchase,
     sum(any_purchase) purchase_sessions FROM sessions WHERE {where}''')[0]
    for k,v in r.items():r[k]=v or 0
    r['view_to_cart']=r['cart_after_view']/r['viewed'] if r['viewed'] else None
    r['cart_to_purchase']=r['purchase_after_cart']/r['cart_after_view'] if r['cart_after_view'] else None
    r['purchase_session_rate']=r['purchase_sessions']/r['sessions'] if r['sessions'] else None
    return r


def analyze(db,path,gap,label):
    counts={r['event']:r['n'] for r in records(db,'SELECT event,count(*) n FROM events GROUP BY event')}
    first,last=db.execute('SELECT min(ts),max(ts) FROM events').fetchone()
    cohorts=records(db,f'''SELECT date(v.first_ts/1000,'unixepoch','weekday 0','-6 days') cohort,
      count(*) visitors,
      sum(v.first_ts+7*86400000<={last}) mature7,
      sum(v.first_ts+7*86400000<={last} AND EXISTS(SELECT 1 FROM events e WHERE e.visitor=v.visitor AND e.ts>v.first_ts+86400000 AND e.ts<=v.first_ts+7*86400000)) return7,
      sum(v.first_ts+30*86400000<={last}) mature30,
      sum(v.first_ts+30*86400000<={last} AND EXISTS(SELECT 1 FROM events e WHERE e.visitor=v.visitor AND e.ts>v.first_ts+86400000 AND e.ts<=v.first_ts+30*86400000)) return30
      FROM visitors v GROUP BY cohort ORDER BY cohort''')
    for c in cohorts:
        c['rate7']=c['return7']/c['mature7'] if c['mature7'] else None
        c['rate30']=c['return30']/c['mature30'] if c['mature30'] else None
    repeat=records(db,f'''WITH firsts AS(SELECT visitor,min(ts) first_purchase FROM orders GROUP BY visitor)
      SELECT count(*) buyers,sum(first_purchase+30*86400000<={last}) mature_buyers,
      sum(first_purchase+30*86400000<={last} AND EXISTS(SELECT 1 FROM orders o WHERE o.visitor=f.visitor AND o.ts>f.first_purchase+86400000 AND o.ts<=f.first_purchase+30*86400000)) repeat_buyers FROM firsts f''')[0]
    repeat['rate']=repeat['repeat_buyers']/repeat['mature_buyers'] if repeat['mature_buyers'] else None
    repeat['wilson95']=wilson(repeat['repeat_buyers'],repeat['mature_buyers'])
    weeks=records(db,"SELECT date(start_ts/1000,'unixepoch','weekday 0','-6 days') week,count(*) sessions,sum(any_purchase) purchase_sessions,sum(cart_ts IS NOT NULL) carts,sum(purchase_ts IS NOT NULL) ordered_purchases FROM sessions GROUP BY week ORDER BY week")
    cart_trial=records(db,f'''WITH first_cart AS(SELECT visitor,min(ts) cart_ts FROM events WHERE event='addtocart' GROUP BY visitor)
      SELECT count(*) cart_visitors,sum(cart_ts+7*86400000<={last}) mature_visitors,
      sum(cart_ts+7*86400000<={last} AND EXISTS(SELECT 1 FROM orders o WHERE o.visitor=c.visitor AND o.ts>c.cart_ts AND o.ts<=c.cart_ts+7*86400000)) converted_visitors
      FROM first_cart c''')[0]
    cart_trial['rate']=cart_trial['converted_visitors']/cart_trial['mature_visitors'] if cart_trial['mature_visitors'] else None
    cart_trial['wilson95']=wilson(cart_trial['converted_visitors'],cart_trial['mature_visitors'])
    quality={
      'identical_rows_collapsed':db.execute('SELECT (SELECT count(*) FROM raw)-(SELECT count(*) FROM events)').fetchone()[0],
      'transaction_rows_missing_id':db.execute("SELECT count(*) FROM events WHERE event='transaction' AND transaction_id IS NULL").fetchone()[0],
      'nontransaction_rows_with_id':db.execute("SELECT count(*) FROM events WHERE event<>'transaction' AND transaction_id IS NOT NULL").fetchone()[0],
      'visitor_timestamp_groups_with_multiple_event_types':db.execute('SELECT count(*) FROM (SELECT visitor,ts FROM events GROUP BY visitor,ts HAVING count(DISTINCT event)>1)').fetchone()[0],
      'transaction_ids_shared_by_visitors':db.execute('SELECT count(*) FROM (SELECT transaction_id FROM orders GROUP BY transaction_id HAVING count(DISTINCT visitor)>1)').fetchone()[0]}
    return {'dataset_label':label,'source_sha256':digest(path),'session_gap_minutes':gap,
      'period_start':datetime.fromtimestamp(first/1000,timezone.utc).isoformat(),
      'period_end':datetime.fromtimestamp(last/1000,timezone.utc).isoformat(),
      'raw_rows':db.execute('SELECT count(*) FROM raw').fetchone()[0],
      'distinct_events':sum(counts.values()),'event_counts':counts,
      'visitors':db.execute('SELECT count(*) FROM visitors').fetchone()[0],
      'orders':db.execute('SELECT count(*) FROM orders').fetchone()[0],
      'funnel':funnel(db),'segments':{'First observed session':funnel(db,'session_no=1'),'Later observed session':funnel(db,'session_no>1')},
      'cohorts':cohorts,'repeat_purchase':repeat,'cart_trial_baseline':cart_trial,'weeks':weeks,'quality':quality,
      'definitions':{'funnel':'Strictly increasing event timestamps within a visitor session. Different items may occur at each stage. No checkout or payment-attempt events exist.',
       'session':'New session after a gap greater than the selected minutes. No device or acquisition segmentation is available.',
       'retention':'Any recorded activity more than 24 hours and at most 7/30 days after first observed event; only fully observable windows. First observed is not first-ever.',
       'repeat':'A distinct order more than 24 hours and at most 30 days after first observed purchase, among buyers with full follow-up.',
       'revenue':'No price, currency, margin, refund or actual revenue fields. Financial scenarios are assumptions only.',
       'inference':'Historical single-site descriptive associations. Session records from the same visitor are dependent; no causal treatment estimate is reported.'}}


def main():
    p=argparse.ArgumentParser();p.add_argument('--input',type=Path,default=ROOT/'data/sample.csv');p.add_argument('--out',type=Path,default=ROOT/'output/sample');p.add_argument('--gap',type=int,default=30);p.add_argument('--label',default='Deterministic visitor-ID modulo 1000 sample; not representative by design');a=p.parse_args()
    a.out.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        db=sqlite3.connect(str(Path(tmp)/'model.db'));db.execute('PRAGMA journal_mode=OFF');db.execute('PRAGMA synchronous=OFF');db.execute('PRAGMA temp_store=FILE')
        load(db,a.input,a.gap);r=analyze(db,a.input,a.gap,a.label);db.close()
    (a.out/'metrics.json').write_text(json.dumps(r,indent=2,sort_keys=True)+'\n')
    for key in ('cohorts','weeks'):
        rows=r[key]
        with (a.out/(key+'.csv')).open('w',newline='') as f:
            w=csv.DictWriter(f,fieldnames=list(rows[0]),lineterminator='\n');w.writeheader();w.writerows(rows)
    manifest={'inputs':{str(x.relative_to(ROOT)):digest(x) for x in [ROOT/'analyze.py',ROOT/'sql/model.sql']},'source_sha256':r['source_sha256'],'metrics_sha256':digest(a.out/'metrics.json')}
    (a.out/'manifest.json').write_text(json.dumps(manifest,indent=2,sort_keys=True)+'\n')
    print(json.dumps({k:r[k] for k in ('raw_rows','visitors','orders','funnel','quality','repeat_purchase')}))

if __name__=='__main__':main()

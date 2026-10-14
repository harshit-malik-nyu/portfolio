"""Historical reporting mart with batch replay checks and full-source reconciliation."""
import argparse
import csv
import hashlib
import json
import sqlite3
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SCHEMA = '''CREATE TABLE events(ts INTEGER NOT NULL, visitor INTEGER NOT NULL,
 event TEXT NOT NULL CHECK(event IN ('view','addtocart','transaction')),
 item INTEGER NOT NULL, tx INTEGER NOT NULL,
 PRIMARY KEY(ts,visitor,event,item,tx)) WITHOUT ROWID;'''
DAILY = '''WITH activity AS (
 SELECT date(ts/1000,'unixepoch') day, count(*) events,
 count(DISTINCT visitor) visitors,
 count(DISTINCT CASE WHEN event='transaction' THEN visitor END) buyers,
 sum(event='view') views, sum(event='addtocart') cart_events,
 sum(event='transaction') transaction_rows
 FROM events GROUP BY day), orders AS (
 SELECT visitor,tx,min(ts) first_ts FROM events WHERE event='transaction' AND tx>=0
 GROUP BY visitor,tx), daily_orders AS (
 SELECT date(first_ts/1000,'unixepoch') day,count(*) orders FROM orders GROUP BY day)
 SELECT a.*,coalesce(o.orders,0) orders FROM activity a LEFT JOIN daily_orders o USING(day)
 ORDER BY a.day'''


def digest(path):
    h=hashlib.sha256()
    with open(path,'rb') as f:
        for chunk in iter(lambda:f.read(1048576),b''):h.update(chunk)
    return h.hexdigest()


def ingest(db, rows):
    """One transaction per batch; malformed rows never leave partial insertions."""
    before=db.total_changes
    try:
        db.execute('BEGIN')
        # ON CONFLICT is scoped to identity only. CHECK failures must not be ignored.
        db.executemany('INSERT INTO events VALUES (?,?,?,?,?) ON CONFLICT(ts,visitor,event,item,tx) DO NOTHING',rows)
        db.commit()
    except Exception:
        db.rollback()
        raise
    return db.total_changes-before


def build(source,out,reference=None):
    out.mkdir(parents=True,exist_ok=True)
    raw=0;batch_count=0;replay_added=None
    with tempfile.TemporaryDirectory() as tmp:
        db=sqlite3.connect(str(Path(tmp)/'report.db'))
        db.executescript(SCHEMA)
        with source.open(newline='') as f:
            reader=csv.DictReader(f)
            if reader.fieldnames != ['timestamp','visitorid','event','itemid','transactionid']:
                raise ValueError('Unexpected source columns')
            batch=[]
            for row in reader:
                values=(int(row['timestamp']),int(row['visitorid']),row['event'],int(row['itemid']),int(row['transactionid']) if row['transactionid'] else -1)
                if values[0]<0 or values[1]<0 or values[3]<0 or values[4]<-1:
                    raise ValueError('Invalid negative identity or timestamp')
                batch.append(values);raw+=1
                if len(batch)==50000:
                    ingest(db,batch);batch_count+=1
                    if replay_added is None:replay_added=ingest(db,batch)
                    batch=[]
            if batch:
                ingest(db,batch);batch_count+=1
                if replay_added is None:replay_added=ingest(db,batch)
        cursor=db.execute(DAILY)
        daily=[dict(zip([x[0] for x in cursor.description],row)) for row in cursor]
        total_events,visitors=db.execute('SELECT count(*),count(DISTINCT visitor) FROM events').fetchone()
        orders=db.execute("SELECT count(*) FROM (SELECT visitor,tx FROM events WHERE event='transaction' AND tx>=0 GROUP BY visitor,tx)").fetchone()[0]
        counts=dict(db.execute('SELECT event,count(*) FROM events GROUP BY event'))
        checks={'replayed_first_batch_inserts_zero':replay_added==0,
                'daily_events_reconcile':sum(r['events'] for r in daily)==total_events,
                'daily_orders_reconcile':sum(r['orders'] for r in daily)==orders,
                'buyers_never_exceed_visitors':all(r['buyers']<=r['visitors'] for r in daily),
                'event_components_reconcile':all(r['views']+r['cart_events']+r['transaction_rows']==r['events'] for r in daily)}
        missing_tx=db.execute("SELECT count(*) FROM events WHERE event='transaction' AND tx<0").fetchone()[0]
        unexpected_tx=db.execute("SELECT count(*) FROM events WHERE event<>'transaction' AND tx>=0").fetchone()[0]
        checks['transaction_id_contract']=missing_tx==0 and unexpected_tx==0
        observed={'raw_rows':raw,'distinct_events':total_events,'visitors':visitors,'orders':orders,'event_counts':counts}
        if reference:
            ref=json.loads(reference.read_text())
            checks['same_raw_source_hash']=digest(source)==ref['source_sha256']
            for key,value in observed.items():checks['baseline_'+key]=value==ref[key]
        if not all(checks.values()):raise ValueError('Reconciliation failed: '+str(checks))
        with (out/'daily.csv').open('w',newline='') as f:
            writer=csv.DictWriter(f,fieldnames=list(daily[0]),lineterminator='\n');writer.writeheader();writer.writerows(daily)
        manifest={'evidence_type':'Historical Retailrocket event backfill; no live customer or employer deployment',
                  'source_sha256':digest(source),'builder_sha256':digest(Path(__file__)),
                  'observed':observed,'input_batches':batch_count,'batch_size_limit':50000,
                  'duplicates_collapsed':raw-total_events,'reporting_days':len(daily),
                  'first_day':daily[0]['day'],'last_day':daily[-1]['day'],'checks':checks,
                  'daily_csv_sha256':digest(out/'daily.csv'),
                  'reference_sha256':digest(reference) if reference else None,
                  'limits':['Batch boundaries simulate file delivery, not observed arrival times.',
                            'Source maximum timestamp is not a producer completeness guarantee.',
                            'First and last days may be partial; no freshness claim.',
                            'Daily visitors are nonadditive; global visitors are computed separately.',
                            'Orders are visitor/transaction pairs attributed to earliest observed date.',
                            'Agreement with the earlier analysis is cross-implementation reconciliation, not external validation.']}
        (out/'manifest.json').write_text(json.dumps(manifest,indent=2,sort_keys=True)+'\n')
        db.close()
    print(json.dumps(manifest['observed'])+'; '+str(len(checks))+' checks passed')
    return manifest

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--input',type=Path,default=ROOT.parent/'data/sample.csv');p.add_argument('--out',type=Path,default=ROOT/'output/sample');p.add_argument('--reference',type=Path,default=ROOT.parent/'output/sample/metrics.json');a=p.parse_args();build(a.input,a.out,a.reference)

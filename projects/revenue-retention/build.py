"""Deterministic synthetic fixture + SQLite analysis. Python standard library only."""
import csv, json, sqlite3
from pathlib import Path
ROOT=Path(__file__).resolve().parent
MONTHS=[f'2026-{m:02d}' for m in range(4,10)]

def fixture():
    accounts=[]; subscriptions=[]; invoices=[]; payments=[]; usage=[]
    for i in range(1,61):
        aid=f'A{i:03}'; start=0 if i<=30 else 2 if i<=45 else 4
        plan=[10000,30000,90000][(i-1)%3]
        activated=int(i%4!=0)
        accounts.append([aid,['Starter','Growth','Scale'][(i-1)%3],MONTHS[start],activated])
        for t in range(start,6):
            active=not (i%10==0 and t>=start+2)
            mrr=plan if active else 0
            subscriptions.append([aid,MONTHS[t],mrr])
            usage.append([aid,MONTHS[t],(2 if i%4==0 else 15)+(i%5) if active else 0])
            if not active: continue
            inv=f'I{i:03}-{t}'; billed=mrr
            if t==5 and i==1: billed-=5000
            if t==5 and i==2: continue
            if t==5 and i==3: billed+=3000
            row=[inv,aid,MONTHS[t],billed]; invoices.append(row)
            if t==5 and i==4: invoices.append(row.copy())
            if t==5 and i==5: continue
            date=f'{MONTHS[t]}-20'
            if t==5 and i==6: date='2026-10-05'
            if t==5 and i==7:
                payments.extend([[inv+'a',inv,date,billed//2],[inv+'b',inv,date,billed-billed//2]])
            else: payments.append([inv+'p',inv,date,billed])
    return {'accounts':(['account_id','segment','cohort','activated_14d'],accounts),
            'subscriptions':(['account_id','month','mrr_cents'],subscriptions),
            'invoices':(['invoice_id','account_id','month','amount_cents'],invoices),
            'payments':(['payment_id','invoice_id','paid_at','amount_cents'],payments),
            'usage':(['account_id','month','active_days'],usage)}

def analyze(tables):
    db=sqlite3.connect(':memory:'); db.row_factory=sqlite3.Row
    schemas={'accounts':'account_id TEXT PRIMARY KEY,segment TEXT,cohort TEXT,activated_14d INTEGER',
      'subscriptions':'account_id TEXT,month TEXT,mrr_cents INTEGER,PRIMARY KEY(account_id,month)',
      'invoices':'invoice_id TEXT,account_id TEXT,month TEXT,amount_cents INTEGER',
      'payments':'payment_id TEXT PRIMARY KEY,invoice_id TEXT,paid_at TEXT,amount_cents INTEGER',
      'usage':'account_id TEXT,month TEXT,active_days INTEGER,PRIMARY KEY(account_id,month)'}
    for name,(cols,rows) in tables.items():
        db.execute(f'CREATE TABLE {name} ({schemas[name]})')
        db.executemany(f'INSERT INTO {name} VALUES ({",".join("?" for _ in cols)})',rows)
    # Only exact duplicates are removable; conflicting identities fail closed.
    conflicts=db.execute('SELECT invoice_id FROM invoices GROUP BY invoice_id HAVING COUNT(DISTINCT account_id||"|"||month||"|"||amount_cents)>1').fetchall()
    if conflicts: raise ValueError('Conflicting invoice identities')
    if db.execute('SELECT 1 FROM payments p LEFT JOIN invoices i USING(invoice_id) WHERE i.invoice_id IS NULL').fetchone(): raise ValueError('Orphan payment')
    db.executescript((ROOT/'analysis.sql').read_text())
    rows=[dict(r) for r in db.execute('SELECT * FROM reconciliation ORDER BY month,account_id')]
    cohorts=[]
    for c in db.execute('SELECT cohort,COUNT(*) n FROM accounts GROUP BY cohort'):
        vals=[]
        for age in range(6):
            idx=MONTHS.index(c['cohort'])+age
            if idx>=6: vals.append(None); continue
            n=db.execute('SELECT COUNT(*) FROM accounts a JOIN subscriptions s USING(account_id) WHERE cohort=? AND month=? AND mrr_cents>0',(c['cohort'],MONTHS[idx])).fetchone()[0]
            vals.append(n)
        cohorts.append({'cohort':c['cohort'],'size':c['n'],'retained':vals})
    sep=[r for r in rows if r['month']==MONTHS[-1]]
    pools={'collection':sum(max(0,r['billed_cents']-r['collected_cents']) for r in sep),
      'onboarding':sum(r['mrr_cents'] for r in sep if not r['activated_14d']),
      'renewal':sum(r['mrr_cents'] for r in sep if r['activated_14d'] and r['active_days']<18)}
    return {'as_of':'2026-09-30','synthetic':True,'rows':rows,'cohorts':cohorts,'pools':pools,
      'duplicates_removed':len(tables['invoices'][1])-len(set(map(tuple,tables['invoices'][1])))}

def build():
    tables=fixture(); (ROOT/'data').mkdir(exist_ok=True)
    for name,(cols,rows) in tables.items():
        with (ROOT/'data'/f'{name}.csv').open('w',newline='') as f:
            w=csv.writer(f,lineterminator="\n"); w.writerow(cols); w.writerows(rows)
    result=analyze(tables)
    (ROOT/'data/results.json').write_text(json.dumps(result,indent=2)+'\n')
    return result
if __name__=='__main__':
    r=build(); print(json.dumps({'rows':len(r['rows']),'pools':r['pools'],'duplicates_removed':r['duplicates_removed']}))

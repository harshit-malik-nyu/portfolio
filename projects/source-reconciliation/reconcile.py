"""Bounded source-to-event reconciliation. Python standard library + SQLite only."""
from pathlib import Path
import datetime as dt, json, re, sqlite3, sys
MAX_BYTES=5*1024*1024

def require(condition):
    if not condition: raise ValueError('Input violates the declared reconciliation contract.')

def timestamp(value):
    require(isinstance(value,str) and re.fullmatch(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z',value) is not None)
    return dt.datetime.fromisoformat(value.replace('Z','+00:00'))

def exact(obj,keys):
    require(type(obj) is dict and set(obj)==set(keys))

def identity(value):
    require(type(value) is str and re.fullmatch(r'[A-Za-z0-9_-]{1,80}',value) is not None)

def dedup(rows,key):
    unique={}; retries=0
    require(type(rows) is list and len(rows)<=10000)
    for r in rows:
        require(type(r) is dict and key in r);identity(r[key])
        if r[key] in unique:
            require(json.dumps(unique[r[key]],sort_keys=True)==json.dumps(r,sort_keys=True));retries+=1
        else:unique[r[key]]=r
    return list(unique.values()),retries

def reconcile(data):
    exact(data,['schemaVersion','evidence','start','end','asOf','graceHours','orders','events'])
    require(type(data['schemaVersion']) is int and data['schemaVersion']==1)
    require(data['evidence'] in ['synthetic','approved_local'])
    start,end,asof=[timestamp(data[k]) for k in ['start','end','asOf']]
    require(start<end<=asof)
    require(type(data['graceHours']) is int and 0<=data['graceHours']<=168)
    mature=asof-dt.timedelta(hours=data['graceHours'])
    orders,order_retries=dedup(data['orders'],'order_id');events,event_retries=dedup(data['events'],'event_id')
    for r in orders:
        exact(r,['order_id','completed_at','status','amount_cents','currency'])
        identity(r['order_id']);timestamp(r['completed_at'])
        require(r['status'] in ['completed','cancelled'])
    for r in events:
        exact(r,['event_id','order_id','occurred_at','received_at','amount_cents','currency'])
        identity(r['event_id']);identity(r['order_id'])
        require(timestamp(r['received_at'])>=timestamp(r['occurred_at']))
    for r in orders+events:
        require(type(r['amount_cents']) is int and 0<=r['amount_cents']<=10**9)
        require(r['currency'] in ['USD','EUR','GBP'])
    # Validation completes before aggregation: contradictory identities abort the entire batch.
    db=sqlite3.connect(':memory:')
    db.executescript('''create table orders(id text primary key, occurred text, status text, cents integer, currency text);
    create table events(id text primary key, order_id text, occurred text, received text, cents integer, currency text);''')
    db.executemany('insert into orders values(?,?,?,?,?)',[(r['order_id'],r['completed_at'],r['status'],r['amount_cents'],r['currency']) for r in orders])
    db.executemany('insert into events values(?,?,?,?,?,?)',[(r['event_id'],r['order_id'],r['occurred_at'],r['received_at'],r['amount_cents'],r['currency']) for r in events])
    cutoff=mature.isoformat(timespec='seconds').replace('+00:00','Z')
    db.execute('create temp table eligible as select * from orders where status="completed" and occurred>=? and occurred<? and occurred<=?',(data['start'],data['end'],cutoff))
    db.execute('create temp table pending as select * from orders where status="completed" and occurred>=? and occurred<? and occurred>?',(data['start'],data['end'],cutoff))
    db.execute('create temp table observed as select * from events where occurred>=? and occurred<? and received<=?',(data['start'],data['end'],data['asOf']))
    db.executescript('''create temp view joined as select o.id,o.cents,o.currency,
      count(e.id) n,
      coalesce(sum(case when e.cents=o.cents and e.currency=o.currency and e.occurred=o.occurred then 1 else 0 end),0) same
      from eligible o left join observed e on o.id=e.order_id group by o.id;''')
    count=lambda query:db.execute(query).fetchone()[0]
    missing=count('select count(*) from joined where n=0')
    duplicated=count('select count(*) from joined where n>1')
    mismatch=count('select count(*) from joined where n=1 and same=0')
    unexpected=count('''select count(*) from observed e where not exists(select 1 from eligible o where o.id=e.order_id)
      and not exists(select 1 from pending p where p.id=e.order_id)''')
    pending_count=count('select count(*) from pending')
    late=db.execute('select count(*) from events where occurred>=? and occurred<? and received>?',(data['start'],data['end'],data['asOf'])).fetchone()[0]
    per_currency=[]
    for currency,expected_cents,matched_cents,missing_cents,exception_cents in db.execute('''select currency,sum(cents),
      sum(case when n=1 and same=1 then cents else 0 end),sum(case when n=0 then cents else 0 end),
      sum(case when n>1 or (n=1 and same=0) then cents else 0 end) from joined group by currency order by currency'''):
        require(expected_cents==matched_cents+missing_cents+exception_cents)
        per_currency.append({'currency':currency,'expectedCents':expected_cents,'matchedCents':matched_cents,'missingCents':missing_cents,'exceptionCents':exception_cents})
    matched=count('select count(*) from joined where n=1 and same=1')
    eligible=count('select count(*) from eligible')
    status='MISMATCH' if missing+duplicated+mismatch+unexpected else 'PENDING' if pending_count else 'NO_ELIGIBLE_ORDERS' if not eligible else 'RECONCILED'
    report={'schemaVersion':1,'evidence':data['evidence'],'status':status,
      'window':{k:data[k] for k in ['start','end','asOf','graceHours']},
      'counts':{'eligibleOrders':eligible,'matchedOrders':matched,'missingOrders':missing,'duplicateOrderEvents':duplicated,
      'mismatchedOrders':mismatch,'unexpectedEvents':unexpected,'pendingOrders':pending_count,'eventsAfterCutoff':late,
      'sourceRedeliveries':order_retries,'eventRedeliveries':event_retries},'amounts':per_currency,
      'limits':['Reconciles only supplied records under the declared snapshot, window and grace assumptions.',
      'RECONCILED is not source authenticity, complete production capture, accounting revenue or rollout approval.',
      'Cancelled orders are not expected transactions. Refunds, partial payments and changing order versions are out of scope.',
      'Currencies remain separate; integer cents are not converted or netted across exceptions.',
      'No raw identifiers are included. Duplicate-order findings count affected orders, not excess event rows.']}
    db.close();return report

def no_duplicate_keys(pairs):
    d={}
    for k,v in pairs:
        require(k not in d);d[k]=v
    return d

def read(path):
    with open(path,'rb') as f: raw=f.read(MAX_BYTES+1)
    require(len(raw)<=MAX_BYTES)
    return json.loads(raw.decode('utf-8'),object_pairs_hook=no_duplicate_keys,parse_constant=lambda _:require(False))

if __name__=='__main__':
    try:
        require(len(sys.argv)==2)
        report=reconcile(read(sys.argv[1]));print(json.dumps(report,indent=2))
        sys.exit(0 if report['status']=='RECONCILED' else 2)
    except (ValueError,TypeError,KeyError,OverflowError,OSError):
        print('Input rejected. Check schema, identities, UTC timestamps, amounts and size. No report was produced.',file=sys.stderr)
        sys.exit(3)

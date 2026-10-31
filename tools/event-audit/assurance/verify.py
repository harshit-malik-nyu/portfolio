"""Independent reference: Python CSV/date validation + SQLite grouping.
Synthetic, bounded cases; neither parser equivalence nor production certification.
"""
from pathlib import Path
import csv, datetime, hashlib, io, json, random, re, sqlite3, subprocess
HERE = Path(__file__).resolve().parent
ENGINE = HERE.parent / 'audit.js'
FIELDS = ['event_id','user_id','event','timestamp','detail']
ALLOWED = ['view','addtocart','transaction']

def reference(text):
    rows = list(csv.DictReader(io.StringIO(text)))
    db = sqlite3.connect(':memory:')
    db.execute('create table events(n integer, id text, user text, event text, signature text, valid integer)')
    findings = {}
    def issue(code,n):
        findings.setdefault(code,[]).append(n)
    for n,r in enumerate(rows,1):
        valid = True
        for field in FIELDS[:4]:
            if not r[field].strip(): issue('missing_'+field,n); valid=False
        if r['event'].strip() and r['event'] not in ALLOWED:
            issue('unknown_event',n);valid=False
        if r['timestamp'].strip():
            t=r['timestamp']
            try:
                if not re.fullmatch(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z',t): raise ValueError()
                datetime.datetime.fromisoformat(t.replace('Z','+00:00'))
            except ValueError: issue('invalid_time',n);valid=False
        db.execute('insert into events values(?,?,?,?,?,?)',(n,r['event_id'],r['user_id'],r['event'],json.dumps(r,sort_keys=True),int(valid)))
    # Group on immutable ID before any valid-row filter: invalid conflicting payloads
    # must also exclude a previously valid copy. Compare retries against first delivery.
    db.executescript('''
    create view groups_ as select id,min(n) first_n,count(distinct signature) variants from events group by id;
    create view accepted as select e.* from events e join groups_ g on e.id=g.id
      where e.valid=1 and g.variants=1 and e.n=g.first_n;
    ''')
    for n,equal in db.execute('''select e.n,e.signature=f.signature from events e
      join groups_ g on e.id=g.id join events f on f.n=g.first_n
      where trim(e.id)<>'' and e.n<>g.first_n order by e.n'''):
        issue('duplicate_id' if equal else 'conflicting_id',n)
    counts=dict(db.execute('select event,count(*) from accepted group by event'))
    summary={'inputRows':len(rows),'provisionallyValidUniqueRows':db.execute('select count(*) from accepted').fetchone()[0],
      'identicalDuplicateRows':len(findings.get('duplicate_id',[])),
      'usersInProvisionalRows':db.execute('select count(distinct user) from accepted').fetchone()[0], 'eventCounts':counts}
    db.close()
    return {'summary':summary,'status':'BLOCKED' if any(k!='duplicate_id' for k in findings) else 'REVIEW' if findings else 'CHECKS_PASSED',
      'findings':{k:{'count':len(v),'records':v[:10]} for k,v in findings.items()}}

def serialize(rows):
    f=io.StringIO(newline='');w=csv.DictWriter(f,fieldnames=FIELDS);w.writeheader();w.writerows(rows);return f.getvalue()

def cases():
    base={'event_id':'e1','user_id':'u1','event':'view','timestamp':'2024-02-29T12:00:00Z','detail':'comma, quote " and\nnewline'}
    named=[('clean',[base]),('identical-retry',[base,base]),('conflict-excludes-first',[base,{**base,'detail':'changed'}]),
      ('retry-after-conflict',[base,{**base,'detail':'changed'},base]),
      ('shared-user',[base,{**base,'event_id':'e2','event':'transaction'}]),
      ('invalid-conflict',[base,{**base,'timestamp':'2025-02-29T12:00:00Z'}])]
    rng=random.Random(731)
    for seed in range(120):
        rows=[]
        for i in range(1+seed%30):
            r={**base,'event_id':f'e{i}','user_id':f'u{i%4}','event':rng.choice(ALLOWED)}
            mode=rng.randrange(9)
            if mode==0:r['timestamp']='2026-04-31T12:00:00Z'
            elif mode==1:r['event']='View'
            elif mode==2:r[rng.choice(FIELDS[:4])]=' '
            elif mode==3:r['timestamp']='2026-01-01T12:00:00.123Z'
            rows.append(r)
            if mode==4:rows.append(dict(r))
            if mode==5:rows.append({**r,'detail':'conflicting optional property'})
        named.append((f'mixed-{seed:03}',rows))
    return [(name,serialize(rows)) for name,rows in named]

RUNNER="""const fs=require('node:fs'),vm=require('node:vm');const input=JSON.parse(fs.readFileSync(0,'utf8'));const m={exports:{}};vm.runInNewContext(input.source,{module:m,exports:m.exports,TextEncoder});console.log(JSON.stringify(input.cases.map(c=>{const r=m.exports.audit(c,['view','addtocart','transaction']);return {summary:r.summary,status:r.status,findings:Object.fromEntries(r.findings.map(f=>[f.code,{count:f.count,records:f.records}]))}})));"""
def run(source,inputs):
    p=subprocess.run(['node','-e',RUNNER],input=json.dumps({'source':source,'cases':inputs}),text=True,capture_output=True,check=True)
    return json.loads(p.stdout)

def main():
    fixtures=cases(); inputs=[v for _,v in fixtures];expected=[reference(v) for v in inputs];source=ENGINE.read_text()
    actual=run(source,inputs)
    assert len(actual)==len(expected)
    for (name,_),a,e in zip(fixtures,actual,expected): assert a==e,(name,a,e)
    mutations=[
      ('E1','Keep first conflicting event', 'if(payloads.get(r.event_id)?.size>1)valid=false;', ''),
      ('E2','Count rows as users','usersInProvisionalRows:users.size','usersInProvisionalRows:validRows'),
      ('E3','Ignore unknown taxonomy', '!names.includes(r.event)','false'),
      ('E4','Lose retry count','duplicateRows++;','duplicateRows+=0;')]
    detected=[]
    for ident,label,old,new in mutations:
        assert source.count(old)==1,(ident,'mutation anchor drift')
        result=run(source.replace(old,new),inputs) # crashes never count as detection
        witnesses=[name for (name,_),a,e in zip(fixtures,result,expected) if a!=e]
        assert len(result)==len(expected) and witnesses,(ident,'not detected')
        detected.append({'id':ident,'defect':label,'detected':True,'firstWitness':witnesses[0]})
    report={'schemaVersion':1,'caseCount':len(fixtures),'matched':len(actual),'methods':['Python standard CSV and datetime','SQLite grouping and aggregation','JavaScript production engine'],
      'fixtures':'126 deterministic synthetic cases, including quoted CSV fields, retries, conflicting optional values, shared users, invalid dates, missing fields and taxonomy drift.',
      'mutationChecks':detected,'limits':'Selected well-formed CSV cases only; no exhaustive parser, Unicode, year-zero, volume, privacy, source-completeness or production validation. Reference and implementation are AI-assisted, not third-party certification.',
      'sha256':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in [ENGINE,Path(__file__)]}}
    (HERE/'results.json').write_text(json.dumps(report,indent=2)+'\n')
    print(f'{len(actual)} cases match independent SQL reference; {len(detected)} selected semantic defects detected.')
if __name__=='__main__': main()

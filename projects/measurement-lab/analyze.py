"""Strict, offline JSON-to-SQL handoff; standard library only. No raw IDs in output."""
import hashlib
import json
from pathlib import Path
import re
import sqlite3
import sys
from datetime import datetime

ROOT = Path(__file__).resolve().parent
SQL = '''
WITH per_session AS (
 SELECT s.session_id,
 MAX(CASE WHEN e.name='product_viewed' THEN 1 ELSE 0 END) AS viewed,
 MAX(CASE WHEN e.name='cart_added' THEN 1 ELSE 0 END) AS carted,
 MAX(CASE WHEN e.name='order_completed' THEN 1 ELSE 0 END) AS completed,
 SUM(CASE WHEN e.name='checkout_failed' THEN 1 ELSE 0 END) AS failed_attempts
 FROM sessions s LEFT JOIN events e ON s.session_id=e.session_id
 GROUP BY s.session_id
)
SELECT COUNT(*) AS started_sessions, SUM(viewed) AS viewed_sessions,
 SUM(carted) AS carted_sessions, SUM(completed) AS completed_sessions,
 SUM(failed_attempts) AS failed_attempts,
 SUM(CASE WHEN failed_attempts>0 AND completed=1 THEN 1 ELSE 0 END) AS recovered_sessions
FROM per_session
'''

class ContractError(ValueError):
    pass

def require(condition, message):
    if not condition:
        raise ContractError(message)

def analyze(payload):
    logs = payload if isinstance(payload, list) else [payload]
    require(1 <= len(logs) <= 1000, 'Expected 1–1000 session logs.')
    sessions = {}; duplicates = 0; sources = set()
    for log in logs:
        require(isinstance(log, dict) and set(log) == {'schema_version','source','state','events'}, 'Invalid envelope fields.')
        require(type(log['schema_version']) in (int, float) and log['schema_version'] == 1, 'Unsupported schema version.')
        require(log['source'] in ('local_demo','synthetic_fixture'), 'Unsupported source type.')
        sources.add(log['source'])
        events = log['events']
        require(isinstance(events,list) and 1 <= len(events) <= 100, 'Expected 1–100 events per session.')
        state='assigned'; identity=None; last=None
        for i,e in enumerate(events,1):
            require(isinstance(e,dict) and set(e)=={'event_id','session_id','sequence','event','occurred_at'}, 'Unexpected or missing event fields.')
            require(isinstance(e['session_id'],str) and re.fullmatch(r's-[A-Za-z0-9-]{1,80}',e['session_id']), 'Invalid session ID.')
            identity=identity or e['session_id']
            require(e['session_id']==identity and e['event_id']==identity+'-'+str(i), 'Inconsistent event identity.')
            require(type(e['sequence']) in (int, float) and e['sequence']==i, 'Invalid sequence.')
            stamp=e['occurred_at']
            require(isinstance(stamp,str) and re.fullmatch(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z',stamp), 'Invalid UTC timestamp.')
            try: time=datetime.strptime(stamp,'%Y-%m-%dT%H:%M:%S.%fZ')
            except ValueError: raise ContractError('Invalid UTC timestamp.') from None
            require(last is None or time>=last, 'Clock regressed.');last=time
            name=e['event'];require(isinstance(name,str),'Invalid event name.')
            if i==1:
                require(name=='session_started','Missing session start.')
            else:
                transitions={'assigned':{'product_viewed':'viewed'},'viewed':{'cart_added':'carted'},'carted':{'checkout_failed':'carted','order_completed':'completed'},'completed':{}}
                require(name in transitions[state],'Invalid journey order.')
                state=transitions[state][name]
        require(log['state']==state,'Declared state disagrees with events.')
        if identity in sessions:
            require(sessions[identity]==log,'Conflicting export for the same session. Use one final snapshot.')
            duplicates+=1
        else: sessions[identity]=log
    require(len(sources)==1,'Do not mix synthetic fixtures and local demo activity.')
    with sqlite3.connect(':memory:') as db:
        db.row_factory=sqlite3.Row
        db.execute('CREATE TABLE sessions(session_id TEXT PRIMARY KEY)')
        db.execute('CREATE TABLE events(event_id TEXT PRIMARY KEY,session_id TEXT,name TEXT)')
        for identity,log in sessions.items():
            db.execute('INSERT INTO sessions VALUES (?)',(identity,))
            db.executemany('INSERT INTO events VALUES (?,?,?)',[(e['event_id'],identity,e['event']) for e in log['events']])
        metrics=dict(db.execute(SQL).fetchone())
    return dict(source=next(iter(sources)),metrics=metrics,
                completion_per_started=metrics['completed_sessions']/metrics['started_sessions'],
                completion_per_viewed=metrics['completed_sessions']/metrics['viewed_sessions'] if metrics['viewed_sessions'] else None,
                exact_session_redeliveries=duplicates,
                interpretation='Descriptive demo session counts; not people, real orders, or a causal effect.')

def unique(pairs):
    d={}
    for k,v in pairs:
        require(k not in d,'Duplicate JSON key.');d[k]=v
    return d

def load(path):
    require(path.stat().st_size<=8*1024*1024,'Input exceeds 8 MiB.')
    return json.loads(path.read_text(encoding='utf-8'),object_pairs_hook=unique,
                      parse_constant=lambda value: (_ for _ in ()).throw(ContractError('Invalid JSON constant.')))

if __name__=='__main__':
    try:
        require(len(sys.argv)==2,'Provide exactly one input path.')
        print(json.dumps(analyze(load(Path(sys.argv[1]))),indent=2,allow_nan=False))
    except (ValueError,TypeError,KeyError,OSError,UnicodeError):
        print('Input rejected: check the documented schema, sequence, identities and source. No partial metrics emitted.',file=sys.stderr)
        sys.exit(2)

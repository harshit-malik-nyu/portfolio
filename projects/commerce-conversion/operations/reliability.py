"""Measured local load/fault experiment, never a production SLA claim."""
import hashlib
import json
import platform
import sqlite3
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from pipeline import connect,refresh,latest
ROOT=Path(__file__).parent
AS_OF='2026-01-02T01:00:00Z'
WATERMARK='2026-01-02T00:00:00Z'

def batch(start,n):
    return {'batch_id':f'load-{start}','complete_through':WATERMARK,'events':[
        {'event_id':f'e{i}','visitor_id':f'v{i%10000}','occurred_at':'2026-01-01T12:00:00Z',
         'event':'transaction' if i%5==0 else 'view','order_id':f'o{i}' if i%5==0 else None}
        for i in range(start,start+n)]}

def run(total=100000,size=10000):
    if total<1 or size<1 or total%size:raise ValueError('Positive total divisible by batch size required')
    with tempfile.TemporaryDirectory() as directory:
        db=connect(str(Path(directory)/'load.sqlite'))
        try:
            measurements=[]
            for start in range(0,total,size):
                incoming=batch(start,size);begin=time.perf_counter()
                result=refresh(db,incoming,AS_OF);elapsed=time.perf_counter()-begin
                assert result['status']=='PUBLISHED'
                assert latest(db)['daily'][0]['events']==start+size
                measurements.append({'batch':incoming['batch_id'],'rows':size,'seconds':round(elapsed,6)})
            before=latest(db);prior_rows=db.execute('SELECT count(*) FROM events').fetchone()[0]
            replay=refresh(db,incoming,AS_OF)
            assert replay['status']=='REPLAY' and latest(db)==before
            conflict=batch(total,1);conflict['batch_id']='fault-conflict'
            conflict['events'].append({**batch(0,1)['events'][0],'visitor_id':'conflicting-owner'})
            rejected=refresh(db,conflict,AS_OF)
            assert rejected['status']=='REJECTED' and latest(db)==before
            assert db.execute('SELECT count(*) FROM events').fetchone()[0]==prior_rows
            stale={'batch_id':'fault-stale','complete_through':'2025-12-29T00:00:00Z','events':[]}
            rejected_stale=refresh(db,stale,AS_OF)
            assert rejected_stale['status']=='REJECTED' and latest(db)==before
            crash=subprocess.run([sys.executable,'-c',
                "import sqlite3,sys,os; d=sqlite3.connect(sys.argv[1]); d.execute('BEGIN IMMEDIATE'); d.execute(\"INSERT INTO events VALUES ('crash-row','2026-01-01T12:00:00Z','crash-visitor','view',NULL)\"); os._exit(7)",
                str(Path(directory)/'load.sqlite')],check=False)
            assert crash.returncode==7
            assert db.execute("SELECT count(*) FROM events WHERE event_id='crash-row'").fetchone()[0]==0
            assert latest(db)==before
            recovery=batch(total,1);recovery['batch_id']='recovery'
            assert refresh(db,recovery,AS_OF)['status']=='PUBLISHED'
            assert latest(db)['version']==before['version']+1
            latencies=sorted(x['seconds'] for x in measurements)
            target=10.0
            return {'scope':'Single-process local SQLite load and fault experiment on synthetic events. Not distributed execution, production traffic, an uptime measurement or contracted SLA.',
                'environment':{'python':platform.python_version(),'sqlite':sqlite3.sqlite_version,'platform':platform.system()},
                'source_sha256':{n:hashlib.sha256((ROOT/n).read_bytes()).hexdigest() for n in ('pipeline.py','reliability.py')},
                'input_rows':total,'batch_size':size,'batches':measurements,'max_batch_seconds':max(latencies),
                'demonstration_latency_target_seconds':target,'batches_within_target':sum(t<=target for t in latencies),
                'pre_fault_report':before,'fault_checks':{'exact_replay_no_new_version':True,'partial_batch_rolled_back':True,'stale_source_blocked':True,'trusted_report_retained':True,'uncommitted_writer_process_crash_rolled_back':True,'recovery_new_version':True},
                'final_event_count':db.execute('SELECT count(*) FROM events').fetchone()[0]}
        finally:db.close()
if __name__=='__main__':
    import argparse
    parser=argparse.ArgumentParser();parser.add_argument('--rows',type=int,default=100000);parser.add_argument('--batch-size',type=int,default=10000);parser.add_argument('--output',default=str(ROOT/'reliability-evidence.json'));a=parser.parse_args()
    result=run(a.rows,a.batch_size);Path(a.output).write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({k:result[k] for k in ('input_rows','max_batch_seconds','batches_within_target','fault_checks')}))

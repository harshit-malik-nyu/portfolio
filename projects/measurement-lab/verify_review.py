"""Compare browser aggregate implementation with independent SQLite path.

Deterministic constructed cases, not a general accuracy estimate.
"""
import copy
import hashlib
import json
from pathlib import Path
import random
import subprocess
from analyze import analyze
ROOT=Path(__file__).resolve().parent

def main():
    templates=json.loads((ROOT/'fixture.json').read_text())
    cases=[]
    for seed in range(100):
        rng=random.Random(seed);logs=[]
        for i in range(rng.randint(1,35)):
            log=copy.deepcopy(rng.choice(templates));identity=f's-{seed}-{i}'
            for j,e in enumerate(log['events'],1):e.update(session_id=identity,event_id=f'{identity}-{j}')
            logs.append(log)
            if rng.random()<.25:logs.append(copy.deepcopy(log))
        rng.shuffle(logs);cases.append(json.dumps(logs))
    bad=[]
    for field,value in [('sequence',True),('sequence',99),('occurred_at','2026-02-30T00:00:00.000Z'),('event','order_completed'),('session_id','private-invalid-id')]:
        x=copy.deepcopy(templates);x[0]['events'][0][field]=value;bad.append(json.dumps(x))
    mixed=copy.deepcopy(templates);mixed[0]['source']='local_demo';bad.append(json.dumps(mixed))
    conflict=copy.deepcopy(templates);changed=copy.deepcopy(conflict[0]);changed['events'].pop();changed['state']='carted';conflict.append(changed);bad.append(json.dumps(conflict))
    bad.append('{"schema_version":1,"schema_version":2}')
    code="""const fs=require('node:fs'),r=require('./review');const input=JSON.parse(fs.readFileSync(0,'utf8'));process.stdout.write(JSON.stringify(input.map(s=>{try{return {ok:true,result:r.analyze(r.parse(s))};}catch{return {ok:false};}})));"""
    proc=subprocess.run(['node','-e',code],cwd=ROOT,input=json.dumps(cases+bad),capture_output=True,text=True,timeout=60,check=True)
    actual=json.loads(proc.stdout)
    for i,text in enumerate(cases):
        expected=analyze(json.loads(text))
        if actual[i]!={'ok':True,'result':expected}:raise RuntimeError(f'Cross-implementation mismatch in case {i}')
    for i,text in enumerate(bad):
        # Use strict loader semantics to reject duplicate JSON keys.
        from analyze import unique
        try: analyze(json.loads(text,object_pairs_hook=unique))
        except (ValueError,TypeError,KeyError): pass
        else: raise RuntimeError(f'Python accepted invalid case {i}')
        if actual[len(cases)+i]!={'ok':False}:raise RuntimeError(f'Browser accepted invalid case {i}')
    report={'scope':'100 constructed valid populations and 8 invalid inputs; cross-implementation agreement, not real-world accuracy or candidate assessment.','valid_population_matches':len(cases),'invalid_inputs_blocked_by_both':len(bad),'population_seed_range':[0,99],'source_sha256':{name:hashlib.sha256((ROOT/name).read_bytes()).hexdigest() for name in ['review.js','events.js','analyze.py','fixture.json','verify_review.py']}}
    (ROOT/'review-verification.json').write_text(json.dumps(report,indent=2)+'\n')
    print('100/100 population results match SQLite; 8/8 invalid inputs rejected by both.')

if __name__=='__main__':main()

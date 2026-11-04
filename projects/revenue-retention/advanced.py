"""Auditable subscription bridges and fixed-allocation randomization checks.
Standard library only. Examples are synthetic, not estimated business effects.
"""
import argparse, csv, hashlib, importlib.util, itertools, json, math
from pathlib import Path
ROOT=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('revenue_core',ROOT/'build.py')
core=importlib.util.module_from_spec(spec);spec.loader.exec_module(core)

def mrr_bridge(previous,current,previously_active=()):
    """Closed population: explicit zero snapshots required; cents throughout.
    previously_active contains accounts with positive MRR before previous month.
    """
    if set(previous)!=set(current): raise ValueError('Both snapshots must contain the same explicit account population')
    for value in list(previous.values())+list(current.values()):
        if type(value) is not int or value<0: raise ValueError('MRR must be nonnegative integer cents')
    if not set(previously_active)<=set(previous): raise ValueError('Unknown historical account')
    out=dict(opening=sum(previous.values()),new=0,reactivation=0,expansion=0,contraction=0,churn=0,closing=sum(current.values()))
    for aid,before in previous.items():
        after=current[aid]
        if before==0 and after>0: out['reactivation' if aid in previously_active else 'new']+=after
        elif before>0 and after==0: out['churn']+=before
        elif after>before: out['expansion']+=after-before
        elif after<before: out['contraction']+=before-after
    out['difference']=out['closing']-(out['opening']+out['new']+out['reactivation']+out['expansion']-out['contraction']-out['churn'])
    opening=out['opening']
    out['grr']=((opening-out['contraction']-out['churn'])/opening) if opening else None
    out['nrr']=((opening+out['expansion']-out['contraction']-out['churn'])/opening) if opening else None
    return out

def experiment(records,min_effect_cents=0):
    """Two-sided exact randomization test of sharp no-effect null.
    Design: complete random assignment with fixed treatment count; complete
    90-day outcomes per assigned account. No post-treatment filtering.
    Enumeration limited to 200,000 allocations, never silently approximated.
    """
    if type(min_effect_cents) is not int or min_effect_cents<0: raise ValueError('Invalid economic threshold')
    ids=set()
    for r in records:
        if not isinstance(r['id'],str) or not r['id'] or r['id'] in ids: raise ValueError('Invalid or duplicate assignment')
        ids.add(r['id'])
        if r['arm'] not in ('T','C'): raise ValueError('Invalid arm')
        if type(r['days']) is not int or r['days']<0: raise ValueError('Invalid follow-up')
        if r['net_cash_cents'] is not None and type(r['net_cash_cents']) is not int: raise ValueError('Cash must be integer cents')
    nt=sum(r['arm']=='T' for r in records);nc=len(records)-nt
    if not nt or not nc: raise ValueError('Both assigned arms required')
    if any(r['days']<90 or r['net_cash_cents'] is None for r in records):
        return {'decision':'HOLD','reason':'Incomplete 90-day assigned-account outcomes','assigned_treatment':nt,'assigned_control':nc,'p_value':None,'effect_cents':None}
    n=len(records);allocations=math.comb(n,nt)
    if allocations>200000: raise ValueError('Exact enumeration exceeds declared limit')
    values=[r['net_cash_cents'] for r in records];total=sum(values)
    treated=sum(r['net_cash_cents'] for r in records if r['arm']=='T')
    observed=abs(treated*n-total*nt)
    extreme=sum(abs(sum(values[i] for i in subset)*n-total*nt)>=observed for subset in itertools.combinations(range(n),nt))
    p=extreme/allocations;effect=treated/nt-(total-treated)/nc
    return {'decision':'REVIEW' if p<=.05 and effect>min_effect_cents else 'HOLD',
      'reason':'Review statistical signal and business threshold; never automatic rollout',
      'assigned_treatment':nt,'assigned_control':nc,'effect_cents':effect,'p_value':p,
      'allocations':allocations,'extreme_allocations':extreme,'threshold_cents':min_effect_cents}

def import_csv(directory):
    """Read five CSVs under the existing closed-snapshot contract."""
    tables={}; hashes={}
    for name,(columns,_) in core.fixture().items():
        path=Path(directory)/f'{name}.csv';raw=path.read_bytes();hashes[path.name]=hashlib.sha256(raw).hexdigest()
        with path.open(newline='',encoding='utf-8') as f:
            reader=csv.reader(f);header=next(reader,None)
            if header!=columns: raise ValueError(f'{name}: header mismatch')
            rows=[]
            for row in reader:
                if len(row)!=len(columns):raise ValueError(f'{name}: row width mismatch')
                converted=[]
                for col,value in zip(columns,row):
                    if col.endswith('_cents') or col in ('active_days','activated_14d'):
                        try: value=int(value)
                        except ValueError as exc:raise ValueError(f'{name}: invalid integer') from exc
                    converted.append(value)
                rows.append(converted)
            tables[name]=(columns,rows)
    result=core.analyze(tables)
    return {'source_sha256':hashes,'analysis':result}

def examples():
    before={'steady':10000,'expand':10000,'contract':30000,'churn':90000,'new':0,'return':0}
    after={'steady':10000,'expand':30000,'contract':10000,'churn':0,'new':10000,'return':30000}
    rows=[{'id':f'A{i}','arm':'T' if i<6 else 'C','days':90,'net_cash_cents':20000 if i<6 else 10000} for i in range(12)]
    missing=[dict(r) for r in rows];missing[0]['net_cash_cents']=None
    return {'synthetic':True,'scope':'Independent acceptance fixtures, not the primary dashboard dataset',
      'mrr_bridge':mrr_bridge(before,after,{'return'}),'experiment_signal':experiment(rows,5000),
      'experiment_missing':experiment(missing,5000),
      'limits':'Sharp-null randomization test is not a confidence interval or a powered real experiment. REVIEW never authorizes rollout.'}
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--input-dir');p.add_argument('--output',required=True);args=p.parse_args()
    result=import_csv(args.input_dir) if args.input_dir else examples()
    # Validation completes before replacing any output.
    output=Path(args.output);temp=output.with_suffix(output.suffix+'.tmp')
    temp.write_text(json.dumps(result,indent=2)+'\n');temp.replace(output)

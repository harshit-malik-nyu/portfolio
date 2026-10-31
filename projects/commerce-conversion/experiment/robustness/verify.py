"""Independent arithmetic + exhaustive small-population missing-outcome oracle.
No external packages, network or paid APIs. This does not validate Wilson coverage.
"""
from decimal import Decimal
import itertools,json,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parent

def verify():
    r=json.loads((ROOT/'results.json').read_text())
    checked=0
    for scenario in r['scenarios']:
        expected_grid=set(itertools.product(r['axes']['cost'],r['axes']['futureVisitors'],r['axes']['margin']))
        assert len(scenario['cells'])==27
        assert {(c['cost'],c['futureVisitors'],c['margin']) for c in scenario['cells']}==expected_grid
        for cell in scenario['cells']:
            d=lambda x:Decimal(str(x))
            volume=d(cell['futureVisitors'])*d(scenario['inputs']['aov'])*d(cell['margin'])
            expected=d(cell['liftLower'])*volume-d(cell['cost'])
            assert abs(d(cell['netLower'])-expected)<Decimal('0.000001')
            assert abs(d(cell['breakEven'])-d(cell['cost'])/volume)<Decimal('0.000000000001')
            if cell['decision']=='ELIGIBLE FOR REVIEW':assert expected>0 and not cell['blockers']
            if scenario['name'] in ('Broken randomization ratio','Incomplete follow-up','Early peek'):
                assert cell['decision']=='INVALID / NOT READY'
            if scenario['name']=='Conversion up, harm up':assert cell['decision']=='HOLD: GUARDRAIL'
            checked+=1
        for cost,volume,margin in expected_grid:
            here=next(c for c in scenario['cells'] if (c['cost'],c['futureVisitors'],c['margin'])==(cost,volume,margin))
            for other in scenario['cells']:
                if other['futureVisitors']==volume and other['margin']==margin and other['cost']>cost:
                    assert other['netLower']<here['netLower']
    # Enumerate every binary completion of the unknown outcomes; no formula oracle.
    cases=[];expected=[]
    for cn,tn in [(1,1),(2,3),(3,2),(4,4)]:
        for ck in range(cn+1):
            for tk in range(tn+1):
                for cu in range(cn-ck+1):
                    for tu in range(tn-tk+1):
                        cases.append(dict(controlN=cn,treatmentN=tn,controlBuy=ck,treatmentBuy=tk,controlUnknown=cu,treatmentUnknown=tu))
                        outcomes=[(tk+sum(t))/tn-(ck+sum(c))/cn for c in itertools.product([0,1],repeat=cu) for t in itertools.product([0,1],repeat=tu)]
                        expected.append((min(outcomes),max(outcomes)))
    js="const m=require('./model.cjs');const xs=JSON.parse(require('fs').readFileSync(0,'utf8'));console.log(JSON.stringify(xs.map(m.missingBounds)))"
    actual=json.loads(subprocess.run(['node','-e',js],cwd=ROOT,input=json.dumps(cases),text=True,capture_output=True,check=True).stdout)
    assert len(actual)==len(expected)
    for item,(lower,upper) in zip(actual,expected):
        assert abs(item['lower']-lower)<1e-12 and abs(item['upper']-upper)<1e-12
    print(f'{checked} economic cells reconciled with Decimal; {len(cases)} missing-outcome cases match exhaustive completions.')
if __name__=='__main__':verify()

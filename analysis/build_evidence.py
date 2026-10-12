"""Cross-check portfolio claims against committed observed outputs and synthetic readouts."""
from pathlib import Path
import json, hashlib, subprocess
ROOT=Path(__file__).resolve().parents[1];project=ROOT/'projects/commerce-conversion'
paths=['projects/commerce-conversion/output/full/metrics.json','projects/commerce-conversion/experiment/readouts.json','projects/commerce-conversion/experiment/decision.js']
m=json.loads((ROOT/paths[0]).read_text());r=json.loads((ROOT/paths[1]).read_text())
expected={'Clear economic gate':'ELIGIBLE FOR REVIEW','Positive lift, weak economics':'HOLD: ECONOMICS','Conversion up, harm up':'HOLD: GUARDRAIL','Broken randomization ratio':'INVALID / NOT READY','Incomplete follow-up':'INVALID / NOT READY','Early peek':'INVALID / NOT READY'}
assert {k:v['result']['decision'] for k,v in r['scenarios'].items()}==expected
assert m['raw_rows']==2756101 and m['visitors']==1407580 and m['orders']==17672
assert m['quality']['identical_rows_collapsed']==460
assert m['distinct_events']==m['raw_rows']-460
assert sum(m['event_counts'].values())==m['distinct_events']
claims={'raw_events':m['raw_rows'],'distinct_events':m['distinct_events'],'visitors':m['visitors'],'distinct_orders':m['orders'],'synthetic_decision_scenarios':len(expected)}
output={'scope':'Cross-checks committed aggregates and scenario decisions, not a fresh raw-data rebuild or employer verification.','claims':claims,'scenario_decisions':expected,'input_sha256':{p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in paths}}
(ROOT/'analysis/output/evidence-index.json').write_text(json.dumps(output,indent=2,sort_keys=True)+'\n')
print(json.dumps(claims))

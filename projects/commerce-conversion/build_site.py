"""Package audited aggregates for the static dashboard. No private visitor records shipped."""
from pathlib import Path
import json,math,hashlib
ROOT=Path(__file__).resolve().parent

def main():
    data={str(gap):json.loads((ROOT/f'output/{folder}/metrics.json').read_text()) for gap,folder in [(15,'gap15'),(30,'full'),(60,'gap60')]}
    full=data['30'];b=full['cart_trial_baseline'];n=b['mature_visitors'];margin=8000/(n*75*.4);p0=b['rate'];delta=.02;p1=p0+delta;pool=(p0+p1)/2
    size=math.ceil((1.959964*math.sqrt(2*pool*(1-pool))+.841621*math.sqrt(p0*(1-p0)+p1*(1-p1)))**2/(delta-margin)**2)
    plan={'baseline':p0,'meaningful_margin':margin,'planning_alternative':delta,'approximate_n_per_arm':size,'total_n':size*2,
      'note':f'Illustrative primary-only planning: a 2.00 pp alternative versus a {margin*100:.2f} pp economic margin needs approximately {size:,} independent visitors per arm (80% power, normal approximation with a 95% lower-interval criterion). This exceeds the historical mature cart audience of {n:,} across both arms. Re-estimate on current traffic; do not weaken the gate to fit the dataset. Guardrail power, identity clustering, allocation losses and a seven-day follow-up add requirements.'}
    data['plan']=plan
    for d in [data['15'],full,data['60']]:
        assert d['source_sha256']=='3745aa83238b1e6d44d8fda209807899f420084398f94ddf745f3cbcfecbf9e7'
        assert d['raw_rows']==d['distinct_events']+d['quality']['identical_rows_collapsed']
        f=d['funnel'];assert f['sessions']>=f['viewed']>=f['cart_after_view']>=f['purchase_after_cart']
        assert sum(s['sessions'] for s in d['segments'].values())==f['sessions']
        assert sum(c['visitors'] for c in d['cohorts'])==d['visitors']
        assert d['orders']==full['orders'] and d['cart_trial_baseline']==b
        for c in d['cohorts']:assert 0<=c['return30']<=c['mature30']<=c['visitors']
    (ROOT/'data.js').write_text('window.COMMERCE_DATA = '+json.dumps(data,sort_keys=True,separators=(',',':'))+';\n')
    (ROOT/'output/experiment-plan.json').write_text(json.dumps(plan,indent=2,sort_keys=True)+'\n')
    source={'dataset':'Retailrocket recommender system dataset','publisher':'Retailrocket','url':'https://www.kaggle.com/datasets/retailrocket/ecommerce-dataset','download_url':'https://www.kaggle.com/api/v1/datasets/download/retailrocket/ecommerce-dataset','license':'CC BY-NC-SA 4.0','retrieved_utc_date':'2026-10-12','file':'events.csv','bytes':94237913,'sha256':full['source_sha256'],'raw_rows':full['raw_rows'],'sample_rule':'visitorid % 1000 == 0, retaining complete visitor histories; deterministic convenience subset, not a probability sample','sample_sha256':hashlib.sha256((ROOT/'data/sample.csv').read_bytes()).hexdigest(),'adaptations':'Exact duplicate collapse; session reconstruction; ordered session funnels; visitor cohorts; aggregated static dashboard. No source outcomes are synthesized.'}
    (ROOT/'data/provenance.json').write_text(json.dumps(source,indent=2,sort_keys=True)+'\n')
    print(plan['note'])

if __name__=='__main__':main()

"""Verify semantic-model grain and reconciliation over actual pipeline scenarios."""
import json
from pathlib import Path
from pipeline import connect,refresh,latest
ROOT=Path(__file__).parent

def build():
    demo=json.loads((ROOT/'demo.json').read_text())
    db=connect(':memory:');db.executescript((ROOT/'warehouse.sql').read_text())
    results=[]
    try:
        for scenario in demo['scenarios']:
            status=refresh(db,scenario['input'],demo['as_of'])
            expected=latest(db)['daily']
            rows=[dict(zip(('day','events','visitors','buyers','orders'),r)) for r in db.execute('SELECT * FROM mart_daily_behavior ORDER BY day_key')]
            assert rows==[{k:r[k] for k in ('day','events','visitors','buyers','orders')} for r in expected]
            assert db.execute('SELECT count(*)=count(DISTINCT event_key) FROM fact_event').fetchone()[0]
            assert db.execute('SELECT count(*) FROM fact_event f LEFT JOIN dim_visitor d ON f.visitor_key=d.visitor_key WHERE d.visitor_key IS NULL').fetchone()[0]==0
            results.append({'scenario':scenario['title'],'status':status['status'],'report_version':latest(db)['version'],'reconciled':True,'daily':rows})
        plan=[r[3] for r in db.execute("EXPLAIN QUERY PLAN SELECT count(*) FROM events WHERE substr(occurred_at,1,10)='2026-01-01' AND event='transaction'")]
        return {'scope':'Synthetic SQLite semantic-model demonstration, not a deployed warehouse or scale benchmark. Day dimension includes observed days only; missing days are not zero activity.','checks':['event-key uniqueness','visitor referential integrity','daily mart reconciliation after each delivery'],'query_plan':plan,'scenarios':results}
    finally:db.close()
if __name__=='__main__':
    report=build();(ROOT/'warehouse-evidence.json').write_text(json.dumps(report,indent=2)+'\n');print('Six warehouse scenario reconciliations passed.')

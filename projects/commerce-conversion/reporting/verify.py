"""Verify published report accounting and hashes, without claiming to rebuild raw data."""
import csv
import json
from pathlib import Path
from build import digest
ROOT=Path(__file__).resolve().parent
for label in ('sample','full'):
    out=ROOT/'output'/label
    m=json.loads((out/'manifest.json').read_text())
    assert m['builder_sha256']==digest(ROOT/'build.py'), 'Builder changed: rerun full and sample reports'
    assert m['daily_csv_sha256']==digest(out/'daily.csv')
    reference=ROOT.parent/'output'/label/'metrics.json'
    assert m['reference_sha256']==digest(reference)
    ref=json.loads(reference.read_text())
    assert m['source_sha256']==ref['source_sha256']
    assert all(m['checks'].values()) and len(m['checks'])==12
    rows=list(csv.DictReader((out/'daily.csv').open()))
    assert len(rows)==m['reporting_days']
    assert sum(int(r['events']) for r in rows)==m['observed']['distinct_events']
    assert sum(int(r['orders']) for r in rows)==m['observed']['orders']
    for r in rows:
        assert int(r['buyers'])<=int(r['visitors'])
        assert int(r['views'])+int(r['cart_events'])+int(r['transaction_rows'])==int(r['events'])
    for key,value in m['observed'].items():assert value==ref[key]
    print(label+': published hashes and accounting checks passed')

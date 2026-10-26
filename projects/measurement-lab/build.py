from pathlib import Path
import hashlib
import json
from analyze import analyze, load
ROOT=Path(__file__).resolve().parent
result=analyze(load(ROOT/'fixture.json'))
result['sha256']={name:hashlib.sha256((ROOT/name).read_bytes()).hexdigest() for name in ['events.js','analyze.py','fixture.json']}
(ROOT/'results.json').write_text(json.dumps(result,indent=2)+'\n')
print('Independent SQL fixture handoff rebuilt.')

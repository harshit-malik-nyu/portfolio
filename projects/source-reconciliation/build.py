from pathlib import Path
import hashlib,json,re
from fixtures import scenarios
from reconcile import reconcile
HERE=Path(__file__).resolve().parent
(HERE/'fixtures').mkdir(exist_ok=True)
results=[]
for i,(name,data) in enumerate(scenarios(),1):
    filename=f'{i:02}-'+re.sub('[^a-z0-9]+','-',name.lower()).strip('-')+'.json'
    raw=json.dumps(data,indent=2)+'\n';(HERE/'fixtures'/filename).write_text(raw)
    results.append({'name':name,'fixture':'fixtures/'+filename,'inputSha256':hashlib.sha256(raw.encode()).hexdigest(),'report':reconcile(data)})
out={'schemaVersion':1,'sourceSha256':{p:hashlib.sha256((HERE/p).read_bytes()).hexdigest() for p in ['reconcile.py','fixtures.py','test_reconcile.py','build.py']},'scenarios':results}
(HERE/'results.json').write_text(json.dumps(out,indent=2)+'\n')
print(f'Built {len(results)} synthetic reconciliation snapshots.')

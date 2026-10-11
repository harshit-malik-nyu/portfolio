"""Audit project discoverability and local assets without requesting a website."""
from pathlib import Path
from html.parser import HTMLParser
import hashlib,json,sqlite3,csv,re
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'analysis/output';OUT.mkdir(exist_ok=True)
class Links(HTMLParser):
 def __init__(self):super().__init__();self.links=[];self.ids=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.append(a['id'])
  for key in ['href','src']:
   if key in a:self.links.append(a[key])
p=Links();p.feed((ROOT/'index.html').read_text())
assert len(p.ids)==len(set(p.ids)),'duplicate HTML IDs'
for link in p.links:
 if link.startswith('#'):assert link[1:] in p.ids,link
 elif not re.match(r'\w+:|//',link):assert (ROOT/link.split('?')[0].split('#')[0]).exists(),link
repos=['abstain','agentcost','citeaudit','evaldrift','floodcheck','knowing-when-to-doubt','lineage','ranksafe','sanctions-triage','underdetermined']
db=sqlite3.connect(':memory:');db.execute('CREATE TABLE projects (repository TEXT PRIMARY KEY,links INTEGER CHECK(links>0))')
for name in repos:
 links=sum(link.rstrip('/')=='https://github.com/harshit-malik-nyu/'+name for link in p.links)
 db.execute('INSERT INTO projects VALUES (?,?)',(name,links))
query=(ROOT/'analysis/questions.sql').read_text();cursor=db.execute(query)
with (OUT/'query_1.csv').open('w',newline='') as f:
 w=csv.writer(f);w.writerow([d[0] for d in cursor.description]);w.writerows(cursor.fetchall())
manifest={'project':'portfolio','case_studies':len(repos),'portfolio_is_separate_project':True,'scope':'static link and asset audit, not visitor behavior or browser rendering','input_sha256':{f:hashlib.sha256((ROOT/f).read_bytes()).hexdigest() for f in ['index.html','app.js','analysis/questions.sql']},'output_sha256':hashlib.sha256((OUT/'query_1.csv').read_bytes()).hexdigest()}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2,sort_keys=True)+'\n')
print(json.dumps({'case_studies':len(repos),'local_assets_and_anchors':'valid'}))

const fs=require('node:fs');const path=require('node:path');const {createSession,validate}=require('./events');
const clock=()=> '2026-01-01T00:00:00.000Z';
const recovered=createSession('s-recovered',clock);for(const a of ['view','cart','fail','fail','complete'])recovered.act(a);
const abandoned=createSession('s-abandoned',clock);abandoned.act('view');
const idle=createSession('s-idle',clock);
const logs=[recovered,abandoned,idle].map(s=>{const p=s.snapshot();p.source='synthetic_fixture';validate(p);return p;});
fs.writeFileSync(path.join(__dirname,'fixture.json'),JSON.stringify(logs,null,2)+'\n');

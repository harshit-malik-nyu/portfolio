const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{spawnSync}=require('node:child_process');
const path=require('node:path');
test('all browser modules parse as ES modules',()=>{
 for(const file of ['local-ai.js','local-ai-worker.js','local-ai-cpu.js','local-ai-cpu-worker.js']){
  const source=fs.readFileSync(path.join(__dirname,'..',file),'utf8');
  const r=spawnSync(process.execPath,['--input-type=module','--check'],{input:source,encoding:'utf8'});
  assert.equal(r.status,0,file+': '+r.stderr);
 }
});
test('CPU adapter routes actual worker replies and rejects failed generations',async()=>{
 const source=fs.readFileSync(path.join(__dirname,'../local-ai-cpu.js'),'utf8');
 const {createCpuEngine}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const handlers={};let fail=false;
 const worker={addEventListener:(name,fn)=>handlers[name]=fn,postMessage:msg=>queueMicrotask(()=>handlers.message({data:fail?{id:msg.id,error:'Inference failed'}:{id:msg.id,result:msg.type==='load'?true:'model text'}}))};
 const engine=await createCpuEngine(worker,()=>{});
 assert.equal((await engine.chat.completions.create({messages:[]})).choices[0].message.content,'model text');
 fail=true;await assert.rejects(engine.chat.completions.create({messages:[]}),/Inference failed/);
});

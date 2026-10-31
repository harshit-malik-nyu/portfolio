'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const engine=require('../tools/event-audit/audit.js');
function harness(){
 const ids=Object.fromEntries(['download','results','status','events','file','run','broken','clean'].map(id=>[id,{hidden:false,disabled:false,textContent:'',value:'view,addtocart,transaction',files:[],append(){},replaceChildren(){}}]));
 const context={document:{getElementById:id=>ids[id],createElement:()=>({append(){}})},EventAudit:engine,TextDecoder,Blob,URL,setTimeout};
 vm.runInNewContext(fs.readFileSync('tools/event-audit/ui.js','utf8'),context);return ids;
}
const valid='event_id,user_id,event,timestamp\ne1,u1,view,2026-01-01T12:00:00Z\n';
function deferredFile(){let resolve,reject;const p=new Promise((a,b)=>{resolve=a;reject=b});return{file:{size:100,text:()=>p.then(b=>new TextDecoder().decode(b)),arrayBuffer:()=>p},resolve,reject};}
for(const action of ['contract','file','example'])test(`stale file completion cannot replace newer ${action} state`,async()=>{
 const el=harness(),d=deferredFile();el.file.files=[d.file];const pending=el.run.onclick();
 if(action==='contract'){el.events.value='view';el.events.oninput();}
 if(action==='file')el.file.onchange();
 if(action==='example')el.clean.onclick();
 const status=el.status.textContent,hidden=el.download.hidden;
 d.resolve(new TextEncoder().encode(valid).buffer);await pending;
 assert.equal(el.status.textContent,status);assert.equal(el.download.hidden,hidden);
});
test('invalid UTF-8 rejects instead of manufacturing replacement identifiers',async()=>{
 const el=harness();const bytes=Buffer.concat([Buffer.from('event_id,user_id,event,timestamp\ne'),Buffer.from([0xff]),Buffer.from(',u1,view,2026-01-01T12:00:00Z\n')]);
 el.file.files=[{size:bytes.length,text:async()=>bytes.toString('utf8'),arrayBuffer:async()=>bytes}];await el.run.onclick();
 assert.equal(el.download.hidden,true);assert.match(el.status.textContent,/Could not read file/);
});
test('valid file publishes a report and re-enables the run button',async()=>{
 const el=harness(),bytes=new TextEncoder().encode(valid);el.file.files=[{size:bytes.length,text:async()=>valid,arrayBuffer:async()=>bytes}];await el.run.onclick();
 assert.equal(el.download.hidden,false);assert.equal(el.run.disabled,false);assert.match(el.status.textContent,/CHECKS_PASSED/);
});

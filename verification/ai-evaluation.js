import {createCpuEngine} from '../local-ai-cpu.js';
const cases=[
 ['Audit my attached rows, then find recovery and acceptance evidence.','operations'],
 ['Audit my attached rows, then find Excel reporting and reconciliation evidence.','reporting'],
 ['Check these rows. As a follow-up, show how interrupted processing can resume without double counting.','operations'],
 ['Check these rows. As a follow-up, show the spreadsheet deliverable for a manager.','reporting'],
 ['Audit the input. For the next step, inspect replay, late arrivals and rollback.','operations'],
 ['Audit the input. For the next step, inspect dashboard reconciliation and the BI handoff.','reporting']
];
const csv='event_id,user_id,event,timestamp\na,u1,view,2026-01-01T00:00:00Z\na,u2,view,2026-01-01T00:00:00Z';
const $=id=>document.getElementById(id);let worker,engine,controller,records=[],timer;
const node=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;return e;};
function release(){clearTimeout(timer);controller?.abort();engine?.dispose();worker?.terminate();engine=null;worker=null;$('stop').disabled=true;$('start').disabled=false;$('strategy').disabled=false;}
$('stop').onclick=()=>{release();$('status').textContent='Stopped. Partial results remain available.';};
$('start').onclick=async()=>{
 records=[];$('results').replaceChildren();$('summary').textContent='';$('export').disabled=true;$('start').disabled=true;$('strategy').disabled=true;$('stop').disabled=false;
 const strategy=$('strategy').value;controller=new AbortController();const signal=controller.signal;
 try{
  timer=setTimeout(()=>{release();$('status').textContent='Evaluation exceeded 12 minutes and was stopped.';},720000);
  worker=new Worker('/local-ai-cpu-worker.js?strategy='+strategy,{type:'module'});
  engine=await createCpuEngine(worker,p=>{$('status').textContent=p.text;},signal);
  for(const [question,expected] of cases){
   if(signal.aborted)break;const started=performance.now();$('status').textContent='Running case '+(records.length+1)+' of '+cases.length;
   const result=await window.LocalAgent.investigate(question,async payload=>{const r=await engine.chat.completions.create(payload);return {content:r.choices[0].message.content,origin:r.decisionOrigin};},{csv,signal});
   const selected=result.trace.find(t=>t.decisionOrigin==='model-selected'&&t.tool==='read_evidence')?.arguments.id||'none';
   const record={question,expected,selected,pass:selected===expected,elapsedMs:Math.round(performance.now()-started),strategy,trace:result.trace};records.push(record);
   const tr=node('tr','');for(const value of [question,expected,selected,record.pass?'PASS':'FAIL'])tr.append(node('td',value));$('results').append(tr);$('export').disabled=false;
   $('summary').textContent=records.filter(r=>r.pass).length+' / '+records.length+' model source choices matched expectations. Application corrections are excluded from this score.';
  }
  if(!signal.aborted)$('status').textContent='Evaluation complete. These six cases do not establish general accuracy.';
 }catch(e){if(!signal.aborted)$('status').textContent='Evaluation failed: '+e.message;}
 finally{release();}
};
$('export').onclick=()=>{const blob=new Blob([JSON.stringify({model:'Qwen2.5-0.5B-Instruct q8',cases:records},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=node('a','');a.href=url;a.download='source-selection-evaluation.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};

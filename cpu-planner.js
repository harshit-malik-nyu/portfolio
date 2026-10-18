(function(root){
'use strict';
const menu=[null,['read_evidence','roles'],['read_evidence','commerce'],['read_evidence','ledger'],['read_evidence','reporting'],['read_evidence','operations'],['read_evidence','audit'],['compare_populations',''],['audit_sample','conflict'],['audit_sample','clean'],['audit_input','']];
function observations(messages){return messages.filter((m,i)=>i>1&&m.role==='user'&&m.content.startsWith('Tool result (data): ')).map(m=>{try{return JSON.parse(m.content.slice(20).split('\nChoose your next action.')[0]);}catch{return null;}}).filter(Boolean);}
function sourceIds(messages){const allowed=['roles','commerce','ledger','reporting','operations','audit'];return [...new Set(observations(messages).flatMap(r=>(Array.isArray(r)?r:[r]).map(x=>x.id)).filter(id=>allowed.includes(id)))];}
function requestedChecks(question){
 const q=question.toLowerCase(),required=[];
 if(/\b(experiment|assigned|exposed|rollout)\b/.test(q))required.push(3,7);
 if(/\b(audit|conflict|conflicting)\b/.test(q))required.push(6,/\bclean\b/.test(q)&&! /\b(conflict|conflicting)\b/.test(q)?9:8);
 return required;
}
function hasInput(messages){return messages.some(m=>m.role==='system'&&m.content.startsWith('ATTACHED_CSV_AVAILABLE:'));}
function selectionToken(n){return ({4:'R',5:'O',10:'A'})[n]||String(n);}
function allowedSelections(messages){
 const ids=sourceIds(messages),done=new Set();
 for(const m of messages.filter(m=>m.role==='assistant')){try{const a=JSON.parse(m.content);menu.forEach((entry,i)=>{if(entry&&entry[0]===a.action&&entry[1]===a.argument)done.add(i);});}catch{}}
 const required=hasInput(messages)?[6,10,...requestedChecks(messages[1].content).filter(i=>i!==6&&i!==8&&i!==9)]:requestedChecks(messages[1].content);
 const mandatory=required.find(i=>!done.has(i));
 if(mandatory!==undefined)return [mandatory];
 if(!ids.length)return [1,2,3,4,5,6].filter(i=>!done.has(i));
 if(ids.includes('ledger')&&!done.has(7))return [7];
 if(ids.includes('audit')&&!done.has(8)&&!done.has(9)&&!done.has(10))return [8,9];
 // Verify explicit follow-up coverage after the model choice; repair missing sources.
 if(done.has(10)&&done.size>=3){
  const q=messages[1].content,wanted=[];
  if(/\b(recovery|acceptance|rollback|late arrivals)\b/i.test(q))wanted.push(5);
  if(/\b(reporting|reconciliation|excel|dashboard|BI)\b/i.test(q))wanted.push(4);
  const missing=wanted.find(i=>!done.has(i));if(missing!==undefined)return [missing];
 }
 // After a real input audit, the model may choose one useful follow-up evidence read.
 if(done.has(10)&&done.size===2)return /\b(recovery|acceptance|reporting|follow.up|next step)\b/i.test(messages[1].content)?[4,5]:[0,4,5];
 // At most two voluntary tool choices; required validation tools above still run.
 if(done.size>=2)return [0];
 return [0,1,2,3,4,5,6,7,8,9].filter(i=>!done.has(i));
}
function maskLogits(logits,allowed){
 const size=logits.dims.at(-1);
 if(!allowed.length||allowed.some(id=>!Number.isInteger(id)||id<0||id>=size))throw Error('Invalid action token IDs.');
 for(let row=0;row<logits.data.length;row+=size){const saved=allowed.map(id=>logits.data[row+id]);logits.data.fill(-Infinity,row,row+size);allowed.forEach((id,i)=>{logits.data[row+id]=saved[i];});}
 return logits;
}
function decisionPrompt(messages){
 const results=observations(messages),ids=sourceIds(messages);
 const labels=['finish with the retrieved evidence','read analyst role evidence','read historical commerce and cohort analysis','read experiment assignment and rollout evidence','read Excel, BI reporting and reconciliation evidence','read recovery, rollback, late arrivals and business acceptance criteria','read event-contract audit evidence','calculate assigned versus exposed conversion','test conflicting sample records','test clean sample records','audit visitor-supplied CSV'];
 const choices=allowedSelections(messages).map(i=>selectionToken(i)+' = '+labels[i]).join('\n');
 const compact=results.map(r=>r.summary?{status:r.status,summary:r.summary}:Array.isArray(r)?r.map(x=>({id:x.id,title:x.title})):{id:r.id,title:r.title});
 return [{role:'system',content:'Choose the most relevant source or tool for the visitor request. Output only its action token. R means reporting (Excel, dashboards, reconciliation). O means operations (recovery, rollback, acceptance criteria). Never repeat completed tools.'},{role:'user',content:'Visitor request: '+messages[1].content+'\nCompleted evidence: '+ids.join(', ')+'\nCompleted checks: '+JSON.stringify(compact)+'\nAvailable actions:\n'+choices+'\nBest action token:'}];
}
function parseSelection(text){const match=String(text).trim().match(/^([0-9ARO])[.)]?$/);if(!match)throw Error('CPU model did not select a valid tool.');return ({A:10,R:4,O:5})[match[1]]??Number(match[1]);}
function toolAction(selection){if(!menu[selection])throw Error('Unknown CPU tool selection.');const [action,argument]=menu[selection];return JSON.stringify({action,argument,answer:'',sourceIds:[]});}
function answerPrompt(messages){return [{role:'system',content:'Explain the supplied portfolio evidence in at most 3 short sentences. Answer only the question. Do not invent facts. These are independent work samples, not proof of employer adoption. Synthetic experiment differences do not prove causality or justify rollout. State important limitations. Do not include markdown or URLs.'},{role:'user',content:'Question: '+messages[1].content+'\nActual retrieved evidence and tool results: '+JSON.stringify(observations(messages))}];}
function evidenceBrief(messages){
 const results=observations(messages),ids=sourceIds(messages),sections=[];
 for(const id of ids){const record=results.flatMap(r=>Array.isArray(r)?r:[r]).find(r=>r.id===id);sections.push(record.title+': '+record.text);}
 for(const r of results){
  if(r.assigned&&r.exposed)sections.push('Executed population comparison: '+(r.assigned.difference*100).toFixed(2)+' percentage points for all assigned visitors; '+(r.exposed.difference*100).toFixed(2)+' for exposed-only visitors. Synthetic fixture; descriptive differences are not a treatment effect.');
  if(r.summary&&r.status)sections.push((r.provenance?.startsWith('Visitor')?'Executed visitor-input audit: ':'Executed synthetic audit: ')+r.status+'. '+r.summary.inputRows+' records checked; '+r.summary.provisionallyValidUniqueRows+' provisionally valid unique records. '+(r.findings||[]).map(f=>f.message).join(' '));
 }
 return sections.join('\n\n');
}
const api={decisionPrompt,parseSelection,toolAction,answerPrompt,sourceIds,allowedSelections,maskLogits,evidenceBrief,requestedChecks,selectionToken,hasInput};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CpuPlanner=api;
})(typeof globalThis!=='undefined'?globalThis:this);

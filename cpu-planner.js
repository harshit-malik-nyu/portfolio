(function(root){
'use strict';
const menu=[null,['read_evidence','roles'],['read_evidence','commerce'],['read_evidence','ledger'],['read_evidence','reporting'],['read_evidence','operations'],['read_evidence','audit'],['compare_populations',''],['audit_sample','conflict'],['audit_sample','clean']];
function observations(messages){return messages.filter(m=>m.role==='user'&&m.content.startsWith('Tool result (data): ')).map(m=>{try{return JSON.parse(m.content.slice(20).split('\nChoose your next action.')[0]);}catch{return null;}}).filter(Boolean);}
function sourceIds(messages){const allowed=['roles','commerce','ledger','reporting','operations','audit'];return [...new Set(observations(messages).flatMap(r=>(Array.isArray(r)?r:[r]).map(x=>x.id)).filter(id=>allowed.includes(id)))];}
function decisionPrompt(messages){
 const results=observations(messages),ids=sourceIds(messages);
 const choices='1 read analyst role evidence; 2 read historical commerce evidence; 3 read experiment evidence; 4 read reporting evidence; 5 read business requirements; 6 read event-audit evidence; 7 calculate assigned versus exposed conversion; 8 test conflicting event records; 9 test clean event records; 0 write final explanation.';
 return [{role:'system',content:'You choose the next tool for a portfolio investigation. Reply with ONE digit only. '+choices+' First read relevant evidence. Do not repeat completed tools. For experiment questions, read experiment evidence and calculate. For audit questions, read audit evidence and test records. Choose 0 only when sufficient tool results are available.'},{role:'user',content:'Question: '+messages[1].content+'\nRetrieved IDs: '+ids.join(', ')+'\nTool results: '+JSON.stringify(results)+'\nChoose the next action digit:'}];
}
function parseSelection(text){const match=String(text).trim().match(/^([0-9])[.)]?$/);if(!match)throw Error('CPU model did not select a valid tool.');return Number(match[1]);}
function toolAction(selection){if(!menu[selection])throw Error('Unknown CPU tool selection.');const [action,argument]=menu[selection];return JSON.stringify({action,argument,answer:'',sourceIds:[]});}
function answerPrompt(messages){return [{role:'system',content:'Explain the supplied portfolio evidence in at most 3 short sentences. Answer only the question. Do not invent facts. These are independent work samples, not proof of employer adoption. Synthetic experiment differences do not prove causality or justify rollout. State important limitations. Do not include markdown or URLs.'},{role:'user',content:'Question: '+messages[1].content+'\nActual retrieved evidence and tool results: '+JSON.stringify(observations(messages))}];}
const api={decisionPrompt,parseSelection,toolAction,answerPrompt,sourceIds};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CpuPlanner=api;
})(typeof globalThis!=='undefined'?globalThis:this);

// Experimental source selector. It does not change permitted tools or safety gates.
(function(root){
function prompt(messages,planner){
 const allowed=planner.allowedSelections(messages);
 if(!allowed.includes(4)||!allowed.includes(5)||allowed.some(n=>![0,4,5].includes(n)))return planner.decisionPrompt(messages);
 const choices='4: reporting deliverables, Excel workbook, dashboard, reconciliation.\n5: operational recovery, rollback, replay, late arrivals, business acceptance criteria.'+(allowed.includes(0)?'\n0: no further evidence requested.':'');
 return [{role:'system',content:'Classify the requested follow-up into one source. The CSV audit has already run. Choose by what the visitor asks to inspect next, not by the fact that CSV was audited. Reply with exactly one digit.\n'+choices},
 {role:'user',content:'Show a spreadsheet handoff to leadership.'},{role:'assistant',content:'4'},
 {role:'user',content:'How would failed processing be restarted safely?'},{role:'assistant',content:'5'},
 {role:'user',content:'Visitor request: '+messages[1].content+'\nSelect the source for the requested follow-up:'}];
}
const api={prompt};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ContrastPlanner=api;
})(typeof globalThis!=='undefined'?globalThis:this);

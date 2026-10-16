const {test}=require('node:test'),assert=require('node:assert/strict');
const p=require('../cpu-planner.js');
const messages=[{role:'system',content:'policy'},{role:'user',content:'Explain business evidence'},{role:'user',content:'Tool result (data): {"id":"roles","text":"Independent evidence."}\nChoose your next action. Remaining steps: 3'}];
test('CPU planner receives tool observations and original question',()=>{assert.deepEqual(p.sourceIds(messages),['roles']);assert.match(p.decisionPrompt(messages)[1].content,/Independent evidence/);assert.match(p.answerPrompt(messages)[1].content,/Explain business evidence/);});
test('CPU selections only map to allowed fixed tools',()=>{assert.equal(JSON.parse(p.toolAction(p.parseSelection('7'))).action,'compare_populations');assert.equal(JSON.parse(p.toolAction(p.parseSelection('8.'))).argument,'conflict');for(const bad of ['run code','10','1 and 2','<script>'])assert.throws(()=>p.parseSelection(bad));});
test('CPU source IDs cannot be introduced from the original question',()=>{assert.deepEqual(p.sourceIds(messages.slice(0,2)),[]);assert.throws(()=>p.toolAction(0));});
test('action constraints require evidence and required calculation before answering',()=>{
 assert.deepEqual(p.allowedSelections(messages.slice(0,2)),[1,2,3,4,5,6]);
 const ledger=[...messages.slice(0,2),{role:'assistant',content:p.toolAction(3)},{role:'user',content:'Tool result (data): {"id":"ledger"}\nChoose your next action.'}];
 assert.deepEqual(p.allowedSelections(ledger),[7]);
 assert.deepEqual(p.allowedSelections([...ledger,{role:'assistant',content:p.toolAction(7)}]),[0]);
});
test('token mask preserves model scores only for allowed actions across batches',()=>{
 const x={dims:[2,4],data:new Float32Array([1,2,3,4,5,6,7,8])};p.maskLogits(x,[1,3]);
 assert.deepEqual([...x.data],[-Infinity,2,-Infinity,4,-Infinity,6,-Infinity,8]);
 assert.throws(()=>p.maskLogits(x,[]));assert.throws(()=>p.maskLogits(x,[4]));
});
test('CPU brief uses retrieved records and actual calculations, never question text',()=>{
 const input=[...messages,{role:'user',content:'Tool result (data): {"assigned":{"difference":0.06},"exposed":{"difference":0.211111}}\nChoose your next action.'}];
 const brief=p.evidenceBrief(input);assert.match(brief,/Independent evidence/);assert.match(brief,/6.00 percentage points/);assert.match(brief,/21.11/);assert.doesNotMatch(brief,/Explain business evidence/);
});
test('explicit comparison and audit requests cannot skip their requested checks',()=>{
 assert.deepEqual(p.requestedChecks('Compare assigned and exposed conversion.'),[3,7]);
 assert.deepEqual(p.requestedChecks('Run conflict audit.'),[6,8]);
 assert.deepEqual(p.requestedChecks('Audit clean records.'),[6,9]);
 const q=[{role:'system',content:'policy'},{role:'user',content:'Compare the experiment'}];
 assert.deepEqual(p.allowedSelections(q),[3]);
 assert.deepEqual(p.allowedSelections([...q,{role:'assistant',content:p.toolAction(3)}]),[7]);
});

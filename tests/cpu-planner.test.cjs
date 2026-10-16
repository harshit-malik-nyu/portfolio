const {test}=require('node:test'),assert=require('node:assert/strict');
const p=require('../cpu-planner.js');
const messages=[{role:'system',content:'policy'},{role:'user',content:'Explain business evidence'},{role:'user',content:'Tool result (data): {"id":"roles","text":"Independent evidence."}\nChoose your next action. Remaining steps: 3'}];
test('CPU planner receives tool observations and original question',()=>{assert.deepEqual(p.sourceIds(messages),['roles']);assert.match(p.decisionPrompt(messages)[1].content,/Independent evidence/);assert.match(p.answerPrompt(messages)[1].content,/Explain business evidence/);});
test('CPU selections only map to allowed fixed tools',()=>{assert.equal(JSON.parse(p.toolAction(p.parseSelection('7'))).action,'compare_populations');assert.equal(JSON.parse(p.toolAction(p.parseSelection('8.'))).argument,'conflict');for(const bad of ['run code','10','1 and 2','<script>'])assert.throws(()=>p.parseSelection(bad));});
test('CPU source IDs cannot be introduced from the original question',()=>{assert.deepEqual(p.sourceIds(messages.slice(0,2)),[]);assert.throws(()=>p.toolAction(0));});

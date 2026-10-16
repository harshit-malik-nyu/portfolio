const {test}=require('node:test'),assert=require('node:assert/strict');
const {investigate}=require('../local-agent.js');
const action=(name,argument='',answer='',sourceIds=[])=>JSON.stringify({action:name,argument,answer,sourceIds});
test('local model receives actual calculation output and returns retrieved sources',async()=>{let n=0;const r=await investigate('Compare experiment',async({messages})=>{n++;if(n===1)return action('read_evidence','ledger');if(n===2)return action('compare_populations');assert.match(messages.at(-1).content,/0.06/);return action('answer','','Synthetic difference; no rollout approval.',['ledger']);});assert.equal(r.trace.length,2);assert.equal(r.sources[0].id,'ledger');});
test('local audit calls the real checker and excludes conflicting identities',async()=>{let n=0;const r=await investigate('Audit conflict',async()=>++n===1?action('read_evidence','audit'):n===2?action('audit_sample','conflict'):action('answer','','Conflicts block this synthetic sample.',['audit']));assert.equal(r.trace[1].result.summary.provisionallyValidUniqueRows,0);});
test('forged sources and unsupported actions cannot escape the tool boundary',async()=>{await assert.rejects(investigate('Help',async()=>action('answer','','Invented claim',['ledger'])),/retrieved/);await assert.rejects(investigate('Help',async()=>action('fetch','https://example.com')),/invalid action/);});
test('cancellation suppresses a late model result',async()=>{const c=new AbortController();await assert.rejects(investigate('Help',async()=>{c.abort();return action('read_evidence','roles');},{signal:c.signal}),/stopped/);});
test('unending model actions stop at the fixed budget',async()=>{let calls=0;await assert.rejects(investigate('Help',async()=>{calls++;return action('read_evidence','roles');}),/Five-step/);assert.equal(calls,5);});
test('invalid input and malformed model output fail closed',async()=>{await assert.rejects(investigate('x'.repeat(801),async()=>''),/800/);await assert.rejects(investigate('Help',async()=>'not JSON'),/unreadable/);});
test('ledger answer cannot bypass the real calculator',async()=>{let n=0;await assert.rejects(investigate('Explain ledger',async()=>++n===1?action('read_evidence','ledger'):action('answer','','Six points.',['ledger'])),/Five-step/);});
test('model can repair an answer by running the missing calculator',async()=>{let n=0;const r=await investigate('Explain ledger',async({messages})=>{n++;if(n===1)return action('read_evidence','ledger');if(n===2)return action('answer','','Six points.',['ledger']);if(n===3){assert.match(messages.at(-1).content,/compare_populations/);return action('compare_populations');}return action('answer','','Synthetic six-point difference, not approval.',['ledger']);});assert.equal(r.trace[1].tool,'compare_populations');});
test('audit answer requires a successful audit rather than an invalid sample',async()=>{let n=0;await assert.rejects(investigate('Explain audit',async()=>++n===1?action('read_evidence','audit'):n===2?action('audit_sample','unknown'):action('answer','','It passed.',['audit'])),/Five-step/);});
test('a single JSON code fence is accepted, not arbitrary surrounding prose',async()=>{let n=0;const r=await investigate('Explain roles',async()=>++n===1?'```json\n'+action('read_evidence','roles')+'\n```':action('answer','','Role evidence.',['roles']));assert.equal(r.sources[0].id,'roles');});
test('one malformed response gets a bounded format correction',async()=>{let n=0;const r=await investigate('Explain roles',async()=>++n===1?'I will look up roles.':n===2?action('read_evidence','roles'):action('answer','','Independent role evidence.',['roles']));assert.equal(n,3);assert.equal(r.trace.length,1);});
const privateCsv='event_id,user_id,event,timestamp\nsecret-record,private-user,view,2026-01-01T00:00:00Z\nsecret-record,other-private-user,transaction,2026-01-01T00:01:00Z';
test('attached CSV is actually audited and raw identifiers never reach model or exported trace',async()=>{
 let n=0;const result=await investigate('Review my events',async ({messages})=>{
  assert.doesNotMatch(JSON.stringify(messages),/private-user|secret-record/);
  n++;
  return {content:n===1?action('read_evidence','audit'):n===2?action('audit_input'):action('answer','','Conflicting input is blocked.',['audit']),origin:n===3?'model-selected':'application-required'};
 },{csv:privateCsv});
 assert.equal(result.trace[1].result.status,'BLOCKED');assert.equal(result.trace[1].result.summary.provisionallyValidUniqueRows,0);
 assert.equal(result.trace[1].decisionOrigin,'application-required');assert.equal(result.completionOrigin,'model-selected');
 assert.doesNotMatch(JSON.stringify(result),/private-user|secret-record/);
});
test('synthetic audit cannot stand in for attached CSV',async()=>{
 let n=0;await assert.rejects(investigate('Check my rows',async()=>++n===1?action('read_evidence','audit'):n===2?action('audit_sample','clean'):action('answer','','Everything passed.',['audit']),{csv:privateCsv}),/Seven-step/);
});
test('invalid input and multibyte CSV over the byte budget are rejected before model calls',async()=>{
 for(const csv of ['',null,'é'.repeat(25001)])await assert.rejects(investigate('Audit',()=>{throw Error('Model must not run');},{csv}),/50,000/);
});
test('malformed attached CSV reports an actionable parse failure without another inference',async()=>{
 let calls=0;await assert.rejects(investigate('Check rows',async()=>{calls++;return action('audit_input');},{csv:'wrong,header\na,b'}),/Missing required column: event_id/);assert.equal(calls,1);
});

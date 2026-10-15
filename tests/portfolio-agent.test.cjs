const {test}=require('node:test');const assert=require('node:assert/strict');
const {runAgent,execute,configured,gateway}=require('../server/portfolio-agent.cjs');
const handler=require('../api/portfolio-agent.js');
const call=(name,args,id='one')=>({role:'assistant',tool_calls:[{id,type:'function',function:{name,arguments:JSON.stringify(args)}}]});
test('model chooses a tool, sees its real result, and returns only retrieved source links',async()=>{
  let step=0;const result=await runAgent('Why hold the experiment?',async({messages})=>{
    if(step++===0)return call('read_evidence',{id:'ledger'});
    assert.match(messages.at(-1).content,/INVALID/);
    return {role:'assistant',content:JSON.stringify({answer:'Hold: the synthetic design gates are invalid.',sourceIds:['ledger']})};
  });assert.equal(result.sources[0].url,'/projects/commerce-conversion/experiment/ledger/');assert.equal(result.trace.length,1);
});
test('unretrieved citations and unsupported answers are rejected',async()=>{
  for(const value of [{answer:'Invented',sourceIds:['ledger']},{answer:'No sources',sourceIds:[]},{}])await assert.rejects(runAgent('question',async()=>({role:'assistant',content:JSON.stringify(value)})));
});
test('unknown tools cannot access files or network; malformed arguments rejected',()=>{
  assert.throws(()=>execute('fetch',{url:'https://example.com'}));assert.throws(()=>execute('read_evidence',{id:'../../etc/passwd'}));assert.throws(()=>execute('compare_populations',{url:'https://example.com'}));assert.throws(()=>execute('search_evidence',{query:'x'.repeat(201)}));
});
test('tool loop has a hard step limit, even when model never answers',async()=>{
  let steps=0;await assert.rejects(runAgent('keep going',async()=>{steps++;return call('read_evidence',{id:'roles'});}),/limit/);assert.equal(steps,5);
});
test('malformed calls fail closed and tools enforce total budget',async()=>{
  await assert.rejects(runAgent('x',async()=>({role:'assistant',tool_calls:[{type:'function'}]})),/Invalid tool call/);
  await assert.rejects(runAgent('x',async()=>({role:'assistant',tool_calls:Array.from({length:4},(_,i)=>call('read_evidence',{id:'roles'},String(i)).tool_calls[0])})),/budget/);
});
test('real audit rejects conflicts and population calculator preserves six-point result',()=>{
  assert.equal(execute('audit_sample',{sample:'conflict'}).summary.provisionallyValidUniqueRows,0);assert.equal(execute('audit_sample',{sample:'clean'}).status,'CHECKS_PASSED');assert.equal(execute('compare_populations',{}).assigned.difference,.06);
});
test('missing enablement, budget acknowledgement or model credentials prevents activation',()=>{
  assert.equal(configured({}),false);const env={PORTFOLIO_AI_ENABLED:'true',PORTFOLIO_AI_BUDGET_CONFIRMED:'true',AI_GATEWAY_MODEL:'test/model',VERCEL_OIDC_TOKEN:'test'};assert.equal(configured(env),true);for(const key of Object.keys(env)){const copy={...env};delete copy[key];assert.equal(configured(copy),false);}
});
test('gateway uses fixed endpoint and server-selected model; failures reveal no provider detail',async()=>{
  const complete=gateway({AI_GATEWAY_MODEL:'test/model',AI_GATEWAY_API_KEY:'test'},async(url,options)=>{assert.equal(url,'https://ai-gateway.vercel.sh/v1/chat/completions');assert.equal(JSON.parse(options.body).model,'test/model');return {ok:false};});await assert.rejects(complete({model:'untrusted'}),/^Error: AI service unavailable\.$/);
});
test('disabled HTTP endpoint reports availability and rejects POST without calling a model',async()=>{
  const old=process.env.PORTFOLIO_AI_ENABLED;delete process.env.PORTFOLIO_AI_ENABLED;
  try{for(const [method,status]of [['GET',200],['POST',503],['DELETE',405]]){const res={setHeader(){},status(n){this.code=n;return this;},json(x){this.body=x;return this;}};await handler({method,headers:{}},res);assert.equal(res.code,status);if(method==='GET')assert.equal(res.body.available,false);}}
  finally{if(old!==undefined)process.env.PORTFOLIO_AI_ENABLED=old;}
});

const {test}=require('node:test');const assert=require('node:assert/strict');const {evaluate,wilson,presets}=require('../experiment/decision.js');const base=presets['Clear economic gate'];
test('adequate valid evidence clears review but never auto-ships',()=>assert.equal(evaluate(base).decision,'ELIGIBLE FOR REVIEW'));
test('positive lift is insufficient when its lower bound cannot pay back cost',()=>{const r=evaluate(presets['Positive lift, weak economics']);assert.ok(r.lift>0);assert.equal(r.decision,'HOLD: ECONOMICS');});
test('harm blocks an otherwise profitable treatment',()=>{const r=evaluate(presets['Conversion up, harm up']);assert.ok(r.economicPass);assert.equal(r.decision,'HOLD: GUARDRAIL');});
test('sample ratio mismatch invalidates interpretation',()=>assert.equal(evaluate(presets['Broken randomization ratio']).decision,'INVALID / NOT READY'));
test('immature users cannot be silently excluded',()=>assert.match(evaluate(presets['Incomplete follow-up']).blockers.join(),/complete seven-day/));
test('early peeking and unverified identity each block a decision',()=>{assert.equal(evaluate(presets['Early peek']).decision,'INVALID / NOT READY');assert.equal(evaluate({...base,identityChecked:false}).decision,'INVALID / NOT READY');});
test('zero contribution margin never clears economics',()=>{const r=evaluate({...base,margin:0});assert.equal(r.breakEven,null);assert.equal(r.economicPass,false);assert.equal(r.netPoint,-8000);});
test('invalid, missing, and impossible counts fail closed',()=>{for(const patch of [{controlN:0},{controlBuy:40001},{treatmentHarm:-1},{aov:NaN},{cost:Infinity},{margin:2},{fixedHorizon:undefined},{controlMature:40001}])assert.throws(()=>evaluate({...base,...patch}));});
test('Wilson bounds handle boundaries without false certainty',()=>{assert.equal(wilson(0,100)[0],0);assert.ok(wilson(0,100)[1]>0);assert.equal(wilson(100,100)[1],1);assert.ok(wilson(100,100)[0]<1);});
test('sparse guardrail data cannot clear approximation gate',()=>assert.equal(evaluate({...base,controlHarm:0,treatmentHarm:0}).decision,'INVALID / NOT READY'));
test('identical arms yield zero lift and a two-sided interval',()=>{const r=evaluate({...base,treatmentBuy:base.controlBuy});assert.equal(r.lift,0);assert.ok(r.liftInterval[0]<0&&r.liftInterval[1]>0);assert.equal(r.srmP,1);});
test('swapping arms reverses the interval',()=>{const a=evaluate(base),b=evaluate({...base,controlBuy:base.treatmentBuy,treatmentBuy:base.controlBuy});assert.ok(Math.abs(a.lift+b.lift)<1e-12);assert.ok(Math.abs(a.liftInterval[0]+b.liftInterval[1])<1e-12);});
test('numeric results match independent SciPy reference calculations',()=>{
 const ref=require('../experiment/numeric-reference.json');
 for(const c of ref.wilson){const got=wilson(c.successes,c.n);got.forEach((v,i)=>assert.ok(Math.abs(v-c.interval[i])<1e-12));}
 for(const c of ref.srm){const r=evaluate({...base,controlN:c.control,treatmentN:c.treatment,controlMature:c.control,treatmentMature:c.treatment,controlBuy:Math.floor(c.control*.3),treatmentBuy:Math.floor(c.treatment*.3),controlHarm:10,treatmentHarm:10});assert.ok(Math.abs(r.srmP-c.p)<2e-7);}
});

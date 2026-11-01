const {test}=require('node:test'),assert=require('node:assert/strict'),{decide}=require('./engine');
const p={collection:120000,onboarding:610000,renewal:1070000};
test('base case ranks activation by cash, not gross revenue',()=>{const d=decide(p,1000,20,1);assert.equal(d.winner.id,'onboarding');assert.ok(Math.abs(d.winner.net-1056.8)<1e-8)});
test('capacity changes winner',()=>assert.equal(decide(p,1000,16,1).winner.id,'onboarding'));
test('budget changes winner',()=>assert.equal(decide(p,300,20,1).winner.id,'collection'));
test('zero budget and zero benefit hold',()=>{assert.equal(decide(p,0,20,1).winner,null);assert.equal(decide(p,1000,20,0).winner,null)});
test('invalid inputs fail closed',()=>{for(const x of [NaN,Infinity,-1])assert.throws(()=>decide(p,x,20,1));assert.throws(()=>decide(p,1000,20,3))});
test('empty eligible pools hold and break-even unavailable',()=>{const d=decide({collection:0,onboarding:0,renewal:0},1000,20,1);assert.equal(d.winner,null);assert.equal(d.rows[0].breakEven,null)});
test('exact budget and capacity are feasible',()=>assert.equal(decide(p,300,6,1).winner.id,'collection'));

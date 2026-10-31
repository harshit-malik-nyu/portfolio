'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{build,missingBounds}=require('./model.cjs');
test('baseline pass is assumption-sensitive, with all validity and harm gates retained',()=>{
 const s=build().scenarios;assert.equal(s[0].eligible,23);assert.equal(s[0].cells.filter(c=>c.decision!=='ELIGIBLE FOR REVIEW').length,4);
 assert.equal(s[0].cells.find(c=>c.cost===8000&&c.futureVisitors===36141&&c.margin===.4).decision,'ELIGIBLE FOR REVIEW');
 for(const x of s.slice(2))assert.equal(x.eligible,0);
});
test('unknown outcomes cannot be silently treated as negative outcomes',()=>{
 const x={controlN:100,treatmentN:100,controlBuy:20,treatmentBuy:25,controlUnknown:10,treatmentUnknown:10};
 const r=missingBounds(x);assert.ok(Math.abs(r.lower-(-.05))<1e-12);assert.ok(Math.abs(r.upper-.15)<1e-12);assert.equal(r.decision,'HOLD: UNKNOWN OUTCOMES');
 assert.equal(missingBounds({...x,controlUnknown:0,treatmentUnknown:0}).complete,true);
});
test('invalid disjoint population counts fail before reporting',()=>{
 const x={controlN:100,treatmentN:100,controlBuy:20,treatmentBuy:25,controlUnknown:10,treatmentUnknown:10};
 for(const patch of [{controlN:0},{controlUnknown:81},{treatmentUnknown:76},{controlBuy:101},{controlUnknown:-1},{treatmentN:1.5},{controlBuy:true},{controlUnknown:NaN}])assert.throws(()=>missingBounds({...x,...patch}));
});

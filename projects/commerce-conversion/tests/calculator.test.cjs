const {test}=require('node:test');const assert=require('node:assert/strict');const {scenario}=require('../dashboard.js');
test('costs use contribution, not gross revenue',()=>{const r=scenario(1000,100,.4,500,.02);assert.equal(r.gross,2000);assert.equal(r.net,300);assert.equal(r.breakEven,.0125);});
test('zero margin cannot pay back a positive cost',()=>{const r=scenario(1000,100,0,500,.02);assert.equal(r.net,-500);assert.equal(r.breakEven,null);});
test('impossible rates and negative inputs are rejected',()=>{assert.throws(()=>scenario(100,75,.4,10,.9,.3));assert.throws(()=>scenario(100,-1,.4,10,.01));assert.throws(()=>scenario(100,75,2,10,.01));});

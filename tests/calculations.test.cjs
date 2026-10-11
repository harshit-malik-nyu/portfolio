const {test}=require('node:test');const assert=require('node:assert/strict');
global.document={addEventListener(){}};
const app=require('../app.js');
test('Unicode names remain meaningful',()=>{
 assert.equal(app.normalise('中国银行'),'中国银行');
 assert.equal(app.score('中国银行','中国银行'),100);
 assert.equal(app.score('MUÑOZ LTD','Munoz'),100);
 assert.equal(app.score('Straße','STRASSE'),100);
 assert.equal(app.score('ACME BANK','APPLE BANK')<100,true);
});
test('planning is monotone and uncertainty shrinks with n',()=>{
 assert.ok(app.minDetectableEffect(100)>app.minDetectableEffect(1000));
 assert.ok(app.itemsRequired(.01)>app.itemsRequired(.02));
 const [lo,hi]=app.wilson(70,100);assert.ok(lo<.7&&hi>.7);
});
test('local telemetry is opt-in, excludes inputs and clears',()=>{
 const m=app.createLocalMetrics();m.record();assert.equal(m.export(),'');
 m.enable();m.record();const rows=m.export().split('\n').map(JSON.parse);
 assert.equal(rows.length,2);assert.equal(rows[1].event,'completed');
 assert.deepEqual(Object.keys(rows[0]).sort(),['elapsed_ms','event','event_id','session_id','source']);
 m.clear();m.record();assert.equal(m.export(),'');
});

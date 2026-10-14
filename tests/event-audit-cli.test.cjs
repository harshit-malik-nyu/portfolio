'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const cli = path.resolve(__dirname, '../tools/event-audit/cli.cjs');
const engine = require('../tools/event-audit/audit.js');
const header = 'event_id,user_id,event,timestamp\n';
const row = 'private-event,private-user,view,2026-01-01T10:00:00Z\n';
function run(content, events='view') {
 const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'event-audit-cli-test-'));
 const file = path.join(dir, 'input.csv');
 try {
  fs.writeFileSync(file, content);
  return spawnSync(process.execPath, [cli,file,'--events',events], {encoding:'utf8'});
 } finally {
  fs.unlinkSync(file); fs.rmdirSync(dir);
 }
}
test('CLI passed report equals shared browser engine and excludes raw IDs', () => {
 const r = run(header+row);
 assert.equal(r.status,0); assert.equal(r.stderr,'');
 assert.deepEqual(JSON.parse(r.stdout),engine.audit(header+row,['view']));
 assert.ok(!r.stdout.includes('private-user')); assert.ok(!r.stdout.includes('private-event'));
});
test('identical retries require review and return nonzero', () => {
 const r=run(header+row+row); assert.equal(r.status,1);
 assert.equal(JSON.parse(r.stdout).status,'REVIEW');
});
test('conflicting IDs block and exclude all affected records', () => {
 const r=run(header+row+row.replace('private-user','another-user'));
 assert.equal(r.status,2);
 assert.equal(JSON.parse(r.stdout).summary.provisionallyValidUniqueRows,0);
});
test('unknown taxonomy blocks', () => { assert.equal(run(header+row,'purchase').status,2); });
test('malformed CSV and repeated taxonomy produce no report', () => {
 for(const r of [run('bad,input\n1,2'),run(header+row,'view,view')]) {
  assert.equal(r.status,3); assert.equal(r.stdout,''); assert.ok(r.stderr.includes('No report'));
 }
});
test('invalid UTF-8 is rejected without replacing identities', () => {
 const r=run(Buffer.concat([Buffer.from(header+row),Buffer.from([0xff])]));
 assert.equal(r.status,3); assert.equal(r.stdout,'');
});
test('oversized input is rejected', () => {
 const r=run(Buffer.alloc(engine.MAX_BYTES+1,65)); assert.equal(r.status,3); assert.equal(r.stdout,'');
});
test('missing file and bad usage return safe errors', () => {
 const r=spawnSync(process.execPath,[cli,'/missing/private-path.csv','--events','view'],{encoding:'utf8'});
 assert.equal(r.status,3); assert.ok(!r.stderr.includes('private-path')); assert.equal(r.stdout,'');
 assert.equal(spawnSync(process.execPath,[cli],{encoding:'utf8'}).status,3);
});
test('help documents nonzero review semantics', () => {
 const r=spawnSync(process.execPath,[cli,'--help'],{encoding:'utf8'});
 assert.equal(r.status,0); assert.ok(r.stdout.includes('1 review required'));
});

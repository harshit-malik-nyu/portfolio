#!/usr/bin/env node
'use strict';
// Local, bounded input. No network, telemetry, persistent state or raw-row output.
const fs = require('node:fs');
const engine = require('./audit.js');
function main(args) {
  if (args.length === 1 && args[0] === '--help') {
    process.stdout.write('Usage: node tools/event-audit/cli.cjs FILE.csv --events view,addtocart,transaction\nExit codes: 0 checks passed; 1 review required; 2 blocked; 3 input/usage error.\nPassing is not proof of complete instrumentation or release approval.\n');
    return 0;
  }
  if (args.length !== 3 || args[1] !== '--events' || !args[2].trim()) {
    process.stderr.write('Provide FILE.csv --events comma,separated,event,names. Use --help for details.\n');
    return 3;
  }
  let descriptor;
  try {
    descriptor = fs.openSync(args[0], 'r');
    if (!fs.fstatSync(descriptor).isFile()) throw Error('Not a regular file');
    // Read at most MAX_BYTES + 1 even if the file grows after it is opened.
    const buffer = Buffer.alloc(engine.MAX_BYTES + 1);
    let used = 0;
    while (used < buffer.length) {
      const read = fs.readSync(descriptor, buffer, used, buffer.length - used, null);
      if (!read) break;
      used += read;
    }
    if (used > engine.MAX_BYTES) throw Error('Input too large');
    // Reject invalid UTF-8 rather than silently replacing identifiers.
    const text = new TextDecoder('utf-8', {fatal:true}).decode(buffer.subarray(0, used));
    const report = engine.audit(text, args[2].split(','));
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
    return {CHECKS_PASSED:0, REVIEW:1, BLOCKED:2}[report.status];
  } catch (_) {
    // Do not copy supplied paths, event names or file contents into error logs.
    process.stderr.write('Input could not be audited. Check readable regular file, UTF-8 encoding, 5 MiB / 20,000-record limits, CSV structure, required columns and distinct event names. No report was produced.\n');
    return 3;
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
  }
}
if (require.main === module) process.exitCode = main(process.argv.slice(2));
module.exports = {main};

'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const r=require('./model.cjs').build();
r.sourceSha256=Object.fromEntries(['model.cjs','../decision.js'].map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,p))).digest('hex')]));
fs.writeFileSync(path.join(__dirname,'results.json'),JSON.stringify(r,null,2)+'\n');
console.log(r.scenarios.map(s=>`${s.name}: ${s.eligible}/${s.total}, ${s.assessment}`).join('\n'));

const fs=require('node:fs');const path=require('node:path');const {evaluate,presets}=require('./decision.js');
const output={evidence:'Synthetic fixtures only; no real randomized trial was conducted.',method:'Four Bonferroni-adjusted Wilson intervals; approximate joint 95% coverage.',scenarios:Object.fromEntries(Object.entries(presets).map(([k,v])=>[k,{inputs:v,result:evaluate(v)}]))};
fs.writeFileSync(path.join(__dirname,'readouts.json'),JSON.stringify(output,null,2)+'\n');
console.log(Object.fromEntries(Object.entries(output.scenarios).map(([k,v])=>[k,v.result.decision])));

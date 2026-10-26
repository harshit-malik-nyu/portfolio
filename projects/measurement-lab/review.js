(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./events'):root.MeasurementLab);if(typeof module==='object'&&module.exports)module.exports=api;else root.MeasurementReview=api;})(typeof globalThis==='undefined'?this:globalThis,lab=>{
'use strict';
// Bounded JSON reader detects duplicate decoded keys before native JSON loses them.
function parse(text){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>8*1024*1024)throw Error('Use a JSON file no larger than 8 MiB.');
 let i=0;const error=()=>{throw Error('Invalid JSON, duplicate field, or excessive nesting.');};
 function ws(){while(/\s/.test(text[i]||'')&&i<text.length){if(!' \t\r\n'.includes(text[i]))error();i++;}}
 function str(){const begin=i++;let escaped=false;while(i<text.length){const c=text[i++];if(c==='"'&&!escaped){try{return JSON.parse(text.slice(begin,i));}catch{error();}}if(c==='\\'&&!escaped)escaped=true;else escaped=false;}error();}
 function value(depth){if(depth>12)error();ws();const c=text[i];
  if(c==='"')return str();
  if(c==='{'||c==='['){i++;const object=c==='{' , out=object?Object.create(null):[],seen=new Set();ws();if(text[i]===(object?'}':']')){i++;return out;}
   while(i<text.length){ws();let key;if(object){if(text[i]!=='"')error();key=str();if(seen.has(key))error();seen.add(key);ws();if(text[i++]!==':')error();}const v=value(depth+1);if(object)out[key]=v;else out.push(v);ws();const end=text[i++];if(end===(object?'}':']'))return out;if(end!==',')error();}error();
  }
  const token=/^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(text.slice(i));if(!token)error();i+=token[0].length;const v=JSON.parse(token[0]);if(typeof v==='number'&&!Number.isFinite(v))error();return v;
 }
 const result=value(0);ws();if(i!==text.length)error();return result;
}
const canonical=x=>JSON.stringify(x,Object.keys(x).sort());
function signature(log){return JSON.stringify([log.schema_version,log.source,log.state,log.events.map(e=>canonical(e))]);}
function analyze(payload){
 const logs=Array.isArray(payload)?payload:[payload];if(logs.length<1||logs.length>1000)throw Error('Provide 1–1000 session logs.');
 const seen=new Map(),sources=new Set();let duplicates=0;
 const m={started_sessions:0,viewed_sessions:0,carted_sessions:0,completed_sessions:0,failed_attempts:0,recovered_sessions:0};
 for(const log of logs){const v=lab.validate(log),id=log.events[0].session_id,sig=signature(log);sources.add(log.source);
  if(seen.has(id)){if(seen.get(id)!==sig)throw Error('Conflicting snapshots for one session. Provide one final snapshot.');duplicates++;continue;}seen.set(id,sig);
  const names=new Set(log.events.map(e=>e.event));m.started_sessions++;m.viewed_sessions+=Number(names.has('product_viewed'));m.carted_sessions+=Number(names.has('cart_added'));m.completed_sessions+=Number(v.completed);m.failed_attempts+=v.failedAttempts;m.recovered_sessions+=Number(v.completed&&v.failedAttempts>0);
 }
 if(sources.size!==1)throw Error('Synthetic fixtures and local demo activity cannot be combined.');
 return {source:[...sources][0],metrics:m,completion_per_started:m.completed_sessions/m.started_sessions,completion_per_viewed:m.viewed_sessions?m.completed_sessions/m.viewed_sessions:null,exact_session_redeliveries:duplicates,interpretation:'Descriptive demo session counts; not people, real orders, or a causal effect.'};
}
return {parse,analyze};
});

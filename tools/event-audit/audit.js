/* Dependency-free event contract audit. Shared by browser and Node tests. */
(function(root){
'use strict';
const VERSION='1.0.0', MAX_BYTES=5*1024*1024, MAX_ROWS=20000;
function parseCSV(text){
 if(new TextEncoder().encode(text).length>MAX_BYTES) throw Error('Use a CSV smaller than 5 MiB.');
 text=text.replace(/^\uFEFF/,'');
 const rows=[]; let row=[],cell='',quoted=false,closed=false;
 function field(){row.push(cell);cell='';closed=false;}
 function record(){field(); if(row.some(x=>x!=='')) rows.push(row); row=[];if(rows.length>MAX_ROWS+1)throw Error('Use at most 20,000 data records.');}
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(quoted){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else cell+=c;continue;}
  if(c===','){field();continue;}
  if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;record();continue;}
  if(closed)throw Error('Unexpected text after a closing CSV quote.');
  if(c==='"'){if(cell!=='')throw Error('A CSV quote must begin a field.');quoted=true;}else cell+=c;
 }
 if(quoted)throw Error('Unclosed CSV quote.');
 if(cell!==''||row.length||closed)record();
 if(rows.length<2)throw Error('Include a header and at least one non-empty data record.');
 const headers=rows.shift().map(x=>x.trim());
 if(new Set(headers).size!==headers.length)throw Error('Duplicate column names are not supported.');
 for(const h of ['event_id','user_id','event','timestamp'])if(!headers.includes(h))throw Error('Missing required column: '+h);
 for(const [i,r] of rows.entries())if(r.length!==headers.length)throw Error('Record '+(i+1)+' has '+r.length+' fields; expected '+headers.length+'.');
 return rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]])));
}
function validTime(t){
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(t))return false;
 const n=Date.parse(t); if(!Number.isFinite(n))return false;
 return new Date(n).toISOString()===t.replace(/(?<!\.\d{3})Z$/,'.000Z');
}
function audit(text,allowed){
 const names=allowed.map(x=>x.trim()).filter(Boolean);
 if(!names.length||new Set(names).size!==names.length)throw Error('Provide distinct, comma-separated allowed event names.');
 const rows=parseCSV(text), issues=new Map(), ids=new Map(),users=new Set(),counts=new Map();
 let validRows=0,duplicateRows=0;
 const payloads=new Map();
 for(const r of rows){if(!r.event_id.trim())continue;if(!payloads.has(r.event_id))payloads.set(r.event_id,new Set());payloads.get(r.event_id).add(JSON.stringify(r));}
 function issue(code,severity,message,action,record){if(!issues.has(code))issues.set(code,{code,severity,message,action,count:0,records:[]});const v=issues.get(code);v.count++;if(v.records.length<10)v.records.push(record);}
 rows.forEach((r,i)=>{
  const record=i+1; let valid=true;
  for(const k of ['event_id','user_id','event','timestamp'])if(!r[k].trim()){valid=false;issue('missing_'+k,'block','Missing '+k+'.','Repair the emitting payload or exclude and quantify affected records.',record);}
  if(r.event.trim()&&!names.includes(r.event)){valid=false;issue('unknown_event','block','Event name is outside the declared contract.','Confirm taxonomy with the owner; fix or explicitly approve the name.',record);}
  if(r.timestamp.trim()&&!validTime(r.timestamp)){valid=false;issue('invalid_time','block','Timestamp is not a valid UTC ISO timestamp.','Use YYYY-MM-DDTHH:mm:ssZ or YYYY-MM-DDTHH:mm:ss.SSSZ; do not guess the timezone.',record);}
  // Compare every supplied column, including optional properties. Column order is fixed by the CSV header.
  const signature=JSON.stringify(r);
  if(r.event_id.trim()&&ids.has(r.event_id)){
   valid=false;
   if(ids.get(r.event_id)===signature){duplicateRows++;issue('duplicate_id','review','Repeated event ID with an identical payload.','Verify retry semantics and deduplicate before computing metrics.',record);}
   else issue('conflicting_id','block','One event ID has conflicting payloads.','Resolve the identity collision upstream; do not silently keep the first row.',record);
  }else if(r.event_id.trim())ids.set(r.event_id,signature);
  if(payloads.get(r.event_id)?.size>1)valid=false;
  if(valid){validRows++;users.add(r.user_id);counts.set(r.event,(counts.get(r.event)||0)+1);}
 });
 const findings=[...issues.values()];
 return {version:VERSION,contract:{required:['event_id','user_id','event','timestamp'],allowedEvents:names,timestamp:'UTC ISO; seconds or exactly three fractional digits',identity:'event_id must uniquely identify an immutable event'},status:findings.some(x=>x.severity==='block')?'BLOCKED':findings.length?'REVIEW':'CHECKS_PASSED',summary:{inputRows:rows.length,provisionallyValidUniqueRows:validRows,identicalDuplicateRows:duplicateRows,usersInProvisionalRows:users.size,eventCounts:Object.fromEntries(counts)},findings,limitations:['Passing these checks is not a release approval or proof of complete instrumentation.','Counts are provisional. All rows sharing a conflicting ID are excluded from provisional counts; do not use this report as a cleaned dataset.','No checks for missing events, identity stitching, consent, revenue reconciliation, freshness, or treatment assignment.','Record numbers count non-empty CSV data records, not physical lines. Findings may overlap; counts must not be added as a rejected-row total.','No raw records or user/event IDs are included in this report. Event taxonomy names remain included.']};
}
const api={audit,parseCSV,validTime,VERSION,MAX_BYTES,MAX_ROWS};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.EventAudit=api;
})(typeof globalThis!=='undefined'?globalThis:this);

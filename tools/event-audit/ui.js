'use strict';
const $=id=>document.getElementById(id);
const header='event_id,user_id,event,timestamp\n';
const good=header+'e1,u1,view,2026-01-01T12:00:00Z\ne2,u1,addtocart,2026-01-01T12:01:00Z\ne3,u1,transaction,2026-01-01T12:02:00Z\ne4,u2,view,2026-01-01T12:03:00Z\n';
const bad=good+'e3,u1,transaction,2026-01-01T12:02:00Z\ne2,u9,addtocart,2026-01-01T12:01:00Z\ne5,,view,2026-01-01T12:03:00Z\ne6,u2,purchase,2026-01-01T12:04:00Z\ne7,u3,view,2026-02-30T12:00:00Z\n';
let report=null;
function node(tag,text,parent){const n=document.createElement(tag);n.textContent=text;if(parent)parent.append(n);return n;}
function reset(message){report=null;$('download').hidden=true;$('results').replaceChildren();$('status').className='';$('status').textContent=message;}
function run(text,label){
 reset('Checking…');
 try{
  report=EventAudit.audit(text,$('events').value.split(','));
  $('status').className=report.status;
  const verdict={BLOCKED:'Resolve blocking findings before using these events for a decision.',REVIEW:'Review duplicates before calculating metrics.',CHECKS_PASSED:'Declared checks passed. Completeness and release readiness remain unverified.'};
  $('status').textContent=label+' · '+report.status+' · '+verdict[report.status];
  const metrics=node('div','',$('results'));metrics.className='metrics';
  for(const [label,value] of [['Input records',report.summary.inputRows],['Provisional unique records',report.summary.provisionallyValidUniqueRows],['Finding types',report.findings.length]]){const n=node('div','',metrics);node('strong',String(value),n);node('span',label,n);}
  for(const f of report.findings){const a=node('article','',$('results'));node('h3',f.severity.toUpperCase()+': '+f.message,a);node('p',f.count+' affected occurrence(s). First record numbers: '+f.records.join(', ')+'.',a);node('p',f.action,a);}
  node('h3','Interpretation limits',$('results'));const ul=node('ul','',$('results'));for(const x of report.limitations)node('li',x,ul);
  $('download').hidden=false;
 }catch(e){reset('Could not audit: '+e.message);}
}
$('broken').onclick=()=>run(bad,'Synthetic broken tracking');
$('clean').onclick=()=>run(good,'Synthetic corrected tracking');
$('events').oninput=()=>reset('Contract changed. Run the audit again.');
$('file').onchange=()=>reset('File selection changed. Run the audit again.');
$('run').onclick=async()=>{const f=$('file').files[0];if(!f)return reset('Choose a CSV first.');if(f.size>EventAudit.MAX_BYTES)return reset('Use a CSV smaller than 5 MiB.');const button=$('run');button.disabled=true;try{run(await f.text(),'Selected CSV');}catch(e){reset('Could not read file: '+e.message);}finally{button.disabled=false;}};
$('download').onclick=()=>{if(!report)return;const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='event-audit-report.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};

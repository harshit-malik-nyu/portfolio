(()=>{'use strict';const $=id=>document.getElementById(id);let report=null,epoch=0;
function clear(message){report=null;$('review-output').replaceChildren();$('review-download').disabled=true;$('review-status').textContent=message;}
function edited(){epoch++;clear('Input changed. Run validation to produce a new result.');}
$('review-input').addEventListener('input',edited);
$('review-file').addEventListener('change',async e=>{edited();const ticket=epoch,file=e.target.files[0];if(!file)return;if(file.size>8*1024*1024){clear('File exceeds 8 MiB.');return;}try{const text=await file.text();if(ticket!==epoch)return;$('review-input').value=text;clear('File read locally. Run validation.');}catch{if(ticket===epoch)clear('Could not read this file.');}});
$('review-clear').onclick=()=>{epoch++;$('review-input').value='';$('review-file').value='';clear('Review input and results cleared.');};
$('review-sample').onclick=async()=>{const ticket=++epoch;clear('Loading the synthetic fixture.');try{const r=await fetch('/projects/measurement-lab/fixture.json');if(!r.ok)throw Error();const text=await r.text();if(ticket!==epoch)return;$('review-input').value=text;clear('Synthetic fixture loaded. Run validation.');}catch{if(ticket===epoch)clear('Fixture unavailable. Paste an exported log instead.');}};
$('review-run').onclick=()=>{epoch++;clear('Validating…');try{const result=MeasurementReview.analyze(MeasurementReview.parse($('review-input').value));report={schema_version:1,engine:'Local JavaScript aggregation; independently compared with Python/SQLite in repository tests.',result,decision:{status:'DESCRIPTIVE ONLY — NO ROLLOUT APPROVAL',reason:'These supplied logs cannot establish real purchases, telemetry completeness or a treatment effect.'}};
 const node=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n;},out=$('review-output');
 out.append(node('h3',report.decision.status),node('p','Source: '+result.source+'. Exact session redeliveries collapsed: '+result.exact_session_redeliveries+'.'));
 const dl=node('dl','');for(const [key,value] of Object.entries(result.metrics)){dl.append(node('dt',key.replaceAll('_',' ')),node('dd',String(value)));}out.append(dl);
 const rate=x=>x===null?'undefined (no viewed sessions)':(x*100).toFixed(2)+'%';out.append(node('p','Completed / started: '+rate(result.completion_per_started)+'. Completed / viewed: '+rate(result.completion_per_viewed)+'.'));
 out.append(node('p',report.decision.reason));$('review-download').disabled=false;$('review-status').textContent='Contract passed. Metrics describe the supplied snapshots only.';
 }catch(e){clear('Blocked. No metrics published. '+(e instanceof Error?e.message:'Check the input contract.'));}};
$('review-download').onclick=()=>{if(!report)return;const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)+'\n'],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='measurement-review.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
})();

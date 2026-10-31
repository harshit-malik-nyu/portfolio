'use strict';
(async()=>{
 const $=id=>document.getElementById(id),money=x=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(x),pp=x=>(100*x).toFixed(2)+' pp';
 let report,record;
 function p(parent,text){const e=document.createElement('p');e.textContent=text;parent.append(e);}
 function options(id,values,label){for(const [i,v]of values.entries()){const o=document.createElement('option');o.value=String(v);o.textContent=label(v,i);$(id).append(o);}$(id).disabled=false;}
 function draw(){record=null;$('download').disabled=true;
  const s=report.scenarios[Number($('scenario').value)],cost=Number($('cost').value),futureVisitors=Number($('futureVisitors').value),margin=Number($('margin').value);
  const c=s.cells.find(c=>c.cost===cost&&c.futureVisitors===futureVisitors&&c.margin===margin);
  $('grid-summary').textContent=`${s.assessment}: ${s.eligible} of ${s.total} planning combinations eligible for review. This fraction is not a probability.`;
  const out=$('decision');out.replaceChildren();const title=document.createElement('h3');title.textContent=c.decision;out.append(title);
  p(out,`Modeled net contribution at the adjusted lift lower bound: ${money(c.netLower)}. Point-estimate contribution: ${money(c.netPoint)}.`);
  p(out,`Adjusted lift lower bound: ${pp(c.liftLower)}. Economic break-even lift: ${pp(c.breakEven)}. Cost must be covered strictly, not merely equaled.`);
  for(const b of c.blockers)p(out,b);
  if(c.decision!=='ELIGIBLE FOR REVIEW')p(out,'Do not approve this scenario. Cheap costs cannot bypass validity or harm requirements.');
  else p(out,'Eligible for review only under the synthetic design assertions and selected assumptions. No launch approval or measured return is implied.');
  const m=report.missing[Number($('unknown').value)],missing=$('missing');missing.replaceChildren();const h=document.createElement('h3');h.textContent=m.result.decision;missing.append(h);p(missing,`Possible purchase-rate difference: ${pp(m.result.lower)} to ${pp(m.result.upper)}.`);
  p(missing,m.result.lower<=0&&m.result.upper>=0?'These incomplete counts permit no benefit or harm as well as benefit. Resolve missingness before a decision.':'The arithmetic range excludes zero, but it does not establish a statistically significant or causal effect.');
  record={schemaVersion:1,evidence:report.evidence,selectedExperiment:s.name,inputs:{...s.inputs,cost,futureVisitors,margin},result:c,grid:{eligible:s.eligible,total:s.total,assessment:s.assessment,probabilityInterpretation:false},separateMissingOutcomeExercise:m,sourceSha256:report.sourceSha256,approval:'No production rollout approval. Missing-outcome bounds are not confidence intervals.'};$('download').disabled=false;
 }
 try{const response=await fetch('/projects/commerce-conversion/experiment/robustness/results.json');if(!response.ok)throw Error('Cannot load verified scenarios.');report=await response.json();
  options('scenario',report.scenarios.map((_,i)=>i),i=>report.scenarios[i].name);
  options('cost',report.axes.cost,money);options('futureVisitors',report.axes.futureVisitors,x=>x.toLocaleString());options('margin',report.axes.margin,x=>100*x+'%');options('unknown',report.missing.map((_,i)=>i),i=>`${report.missing[i].inputs.controlUnknown.toLocaleString()} per arm`);
  $('cost').value='8000';$('futureVisitors').value='36141';$('margin').value='0.4';
  for(const id of ['scenario','cost','futureVisitors','margin','unknown'])$(id).addEventListener('change',draw);draw();
 }catch{ $('grid-summary').textContent='Verified results unavailable. Reload to retry or inspect the linked source. No decision record can be exported.';return; }
 $('download').addEventListener('click',()=>{if(!record)return;const url=URL.createObjectURL(new Blob([JSON.stringify(record,null,2)+'\n'],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='synthetic-robustness-review.json';a.click();URL.revokeObjectURL(url);});
})();

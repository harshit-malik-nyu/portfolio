'use strict';
(async()=>{
 const $=id=>document.getElementById(id);let data,record;
 const meanings={RECONCILED:'Supplied mature orders reconcile. This is not approval to launch or recognition of revenue.',MISMATCH:'Hold completeness-dependent analysis. Investigate the listed exceptions before relying on the export.',PENDING:'Wait for the predefined maturity window or review a comparable mature population. Do not hide pending orders.',NO_ELIGIBLE_ORDERS:'No eligible population. There is no successful reconciliation to claim.'};
 function render(){
  record=null;$('download').disabled=true;
  const s=data.scenarios[Number($('scenario').value)],r=s.report,w=r.window;
  $('context').textContent=`Window [${w.start}, ${w.end}); as of ${w.asOf}; grace ${w.graceHours} hours. Evidence: ${r.evidence}.`;
  $('decision').textContent=r.status+' — '+meanings[r.status];$('counts').replaceChildren();
  for(const [k,label] of [['eligibleOrders','Eligible source orders'],['matchedOrders','Exactly matched orders'],['missingOrders','Missing orders'],['duplicateOrderEvents','Orders with duplicate events'],['mismatchedOrders','Orders with value/time mismatch'],['unexpectedEvents','Unexpected events'],['pendingOrders','Pending source orders'],['eventsAfterCutoff','Events after cutoff'],['eventRedeliveries','Exact event retries']]){
   const box=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=String(r.counts[k]);box.append(dt,dd);$('counts').append(box);
  }
  $('money').replaceChildren();for(const row of r.amounts){const tr=document.createElement('tr');for(const k of ['currency','expectedCents','matchedCents','missingCents','exceptionCents']){const td=document.createElement('td');td.textContent=String(row[k]);tr.append(td);}$('money').append(tr);}
  $('next').textContent=r.amounts.length?'Interpret each currency separately. Missing and exception amounts describe source records awaiting reconciliation; they are not quantified losses.':'No mature source amounts in scope. Empty totals are not evidence of success.';
  $('fixture').href='/projects/source-reconciliation/'+s.fixture;$('fixture').hidden=false;
  record={scenario:s.name,inputSha256:s.inputSha256,sourceSha256:data.sourceSha256,...r};$('download').disabled=false;
 }
 try{const response=await fetch('/projects/source-reconciliation/results.json');if(!response.ok)throw Error();data=await response.json();$('scenario').replaceChildren();data.scenarios.forEach((s,i)=>{const opt=document.createElement('option');opt.value=String(i);opt.textContent=s.name;$('scenario').append(opt);});$('scenario').disabled=false;$('scenario').value='1';$('scenario').addEventListener('change',render);render();}
 catch{record=null;$('scenario').disabled=true;$('download').disabled=true;$('decision').textContent='Results unavailable. No decision record can be exported. Reload or inspect the source.';}
 $('download').addEventListener('click',()=>{if(!record)return;const url=URL.createObjectURL(new Blob([JSON.stringify(record,null,2)+'\n'],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='synthetic-reconciliation-record.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
})();

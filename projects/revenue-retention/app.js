'use strict';
const $=id=>document.getElementById(id),money=x=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(x),pct=x=>(x*100).toFixed(1)+'%';
let data,visible=[];
function renderLedger(){
 const rows=data.rows.filter(r=>r.month===$('month').value&&($('segment').value==='all'||r.segment===$('segment').value));
 const sums=['mrr_cents','billed_cents','collected_cents','billing_gap_cents','collection_gap_cents'].map(k=>rows.reduce((s,r)=>s+r[k],0)/100);
 $('metrics').innerHTML=['Contracted MRR','Invoiced amount','Collected by cutoff'].map((x,i)=>`<div class="metric"><span>${x}</span><strong>${money(sums[i])}</strong></div>`).join('');
 $('bridge').innerHTML=`<span>${money(sums[0])} contracted</span><span>− ${money(sums[3])} billing gap</span><span>− ${money(sums[4])} collection gap</span><span>= ${money(sums[2])} collected</span>`;
 visible=rows.filter(r=>!$('exceptions').checked||r.billing_gap_cents||r.collection_gap_cents);
 $('ledger').innerHTML=visible.map(r=>`<tr><td><button data-account="${r.account_id}">${r.account_id}</button></td><td>${r.segment}</td>${['mrr_cents','billed_cents','collected_cents','billing_gap_cents','collection_gap_cents'].map(k=>`<td class="${k.includes('gap')&&r[k]?'warning':''}">${money(r[k]/100)}</td>`).join('')}</tr>`).join('')||'<tr><td colspan="7">No exceptions in this selection.</td></tr>';
 $('row-count').textContent=`${visible.length} displayed / ${rows.length} account-month records. One exact duplicate invoice removed across the source.`;
}
function decision(){
 const budget=$('budget').valueAsNumber,hours=$('hours').valueAsNumber,effect=$('effect').valueAsNumber;
 $('effect-value').textContent=effect.toFixed(2)+'×';
 try{
 const result=RevenueEngine.decide(data.pools,budget,hours,effect);
 $('recommendation').innerHTML=result.winner?`<p class="eyebrow" style="color:#bce9cf">CONDITIONAL PILOT CANDIDATE</p><h3>${result.winner.name}</h3><p>${money(result.winner.net)} modeled net incremental cash over 90 days. Validate the assumed effect before rollout. Small differences between candidates are assumption-sensitive, not evidence of superiority.</p>`:'<h3>Hold investment</h3><p>No affordable, capacity-feasible pilot has positive modeled net cash. Change the constraints or gather stronger evidence.</p>';
 $('options').innerHTML=result.rows.map(r=>`<article class="option"><div class="option-head"><h3>${r.name}</h3><strong>${money(r.net)}</strong></div><small>${r.basis} · ${money(r.pool)} eligible pool</small><p>${money(r.cost)} spend · ${r.hours} hours · ${pct(r.rate*effect)} assumed incremental effect<br>Break-even effect: ${r.breakEven===null?'Unavailable':pct(r.breakEven)} · ${r.feasible?'Within constraints':'Outside budget or capacity'}</p></article>`).join('');
 }catch(e){$('recommendation').textContent='Enter valid nonnegative budget and hours.';$('options').textContent='';}
}
fetch('/projects/revenue-retention/data/results.json').then(r=>{if(!r.ok)throw Error('Snapshot unavailable');return r.json()}).then(d=>{
 data=d;renderLedger();decision();$('status').textContent='';
 $('cohorts').innerHTML=data.cohorts.map(c=>`<tr><td>${c.cohort}</td><td>${c.size}</td>${c.retained.map(n=>n===null?'<td aria-label="Not yet observed">—</td>':`<td>${pct(n/c.size)}<br><small>${n} / ${c.size}</small></td>`).join('')}</tr>`).join('');
 for(const id of ['month','segment','exceptions'])$(id).addEventListener('change',renderLedger);
 $('controls').addEventListener('input',decision);$('controls').addEventListener('submit',e=>e.preventDefault());$('controls').addEventListener('reset',()=>setTimeout(decision,0));
 $('ledger').addEventListener('click',e=>{const b=e.target.closest('[data-account]');if(!b)return;const id=b.dataset.account;$('account-detail').open=true;$('history').innerHTML=`<h3>${id} · full available history</h3>`+data.rows.filter(r=>r.account_id===id).map(r=>`<p>${r.month}: ${money(r.mrr_cents/100)} MRR / ${money(r.billed_cents/100)} billed / ${money(r.collected_cents/100)} collected · ${r.active_days} active days</p>`).join('');$('account-detail').scrollIntoView({block:'nearest'});});
 $('export').addEventListener('click',()=>{const keys=['account_id','month','segment','mrr_cents','billed_cents','collected_cents','billing_gap_cents','collection_gap_cents'];const csv=[keys.join(','),...visible.map(r=>keys.map(k=>r[k]).join(','))].join('\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));const a=document.createElement('a');a.href=url;a.download='synthetic-revenue-ledger.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
}).catch(()=>{$('status').textContent='The snapshot could not load. Refresh or use the source downloads below.';});

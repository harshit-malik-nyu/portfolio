// Navigation is local and deterministic; no tracking or model download.
(()=>{
 const routes={
 data:{title:'From raw events to a defensible metric.',text:'Inspect the grain, challenge invalid records, then trace the calculation.',links:[['Explore historical analysis','/projects/commerce-conversion/'],['Test the data contract','/tools/event-audit/'],['Trace a metric to SQL','/projects/commerce-conversion/experiment/ledger/']]},
 business:{title:'From assumptions to an investment decision.',text:'Change the economics, inspect the recommendation, then review operational acceptance.',links:[['Change the investment assumptions','/projects/commerce-conversion/'],['Read the decision brief','/projects/commerce-conversion/readout'],['Inspect recovery and acceptance','/projects/commerce-conversion/operations/']]},
 product:{title:'From a positive number to a valid decision.',text:'Compare denominators, inspect experiment gates, then test instrumentation quality.',links:[['Explore assignment and exposure','/projects/commerce-conversion/experiment/ledger/'],['Inspect experiment requirements','/projects/commerce-conversion/experiment/'],['Challenge event quality','/tools/event-audit/']]}
 };
 const output=document.getElementById('role-review-content');if(!output)return;
 let selected='data';
 const controls=document.createElement('div');controls.className='review-share';
 const copy=document.createElement('button');copy.type='button';copy.className='text-button';copy.textContent='Copy this review link';
 const status=document.createElement('span');status.setAttribute('role','status');
 const fallback=document.createElement('input');fallback.type='url';fallback.readOnly=true;fallback.hidden=true;fallback.setAttribute('aria-label','Review link to copy');
 controls.append(copy,status,fallback);output.after(controls);
 function select(role){
 const route=routes[role];if(!route)return;selected=role;status.textContent='';fallback.hidden=true;
 for(const b of document.querySelectorAll('[data-review-role]'))b.setAttribute('aria-pressed',String(b.dataset.reviewRole===role));
 const p=document.createElement('p'),strong=document.createElement('strong');strong.textContent=route.title;p.append(strong,' '+route.text);
 const list=document.createElement('ol');for(const [label,url] of route.links){const li=document.createElement('li'),a=document.createElement('a');a.textContent=label;a.href=url;li.append(a);list.append(li);}
 const limit=document.createElement('p');limit.className='review-limit';limit.textContent='Historical data and synthetic fixtures; no production-client impact is claimed.';output.replaceChildren(p,list,limit);
 }
 for(const button of document.querySelectorAll('[data-review-role]'))button.addEventListener('click',()=>select(button.dataset.reviewRole));
 const requested=new URLSearchParams(location.search).get('review');if(Object.hasOwn(routes,requested))select(requested);
 copy.addEventListener('click',async()=>{
 const url=new URL('/',location.href);url.searchParams.set('review',selected);url.hash='work';
 try{await navigator.clipboard.writeText(url.href);status.textContent='Review link copied.';}
 catch{fallback.value=url.href;fallback.hidden=false;fallback.focus();fallback.select();status.textContent='Copy the selected link below.';}
 });
})();

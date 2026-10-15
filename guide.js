(function(root){
'use strict';
const roles={data:'Data analyst',business:'Business analyst',product:'Product analyst'};
const goals={reliability:{label:'Can I trust the reporting?',url:'/projects/commerce-conversion/operations/',title:'Inspect reporting recovery'},investment:{label:'Is a change worth funding?',url:'/projects/commerce-conversion/readout',title:'Read the commercial decision'},measurement:{label:'Did the product change work?',url:'/projects/commerce-conversion/experiment/ledger/',title:'Inspect assignment-to-decision evidence'}};
const samples={clean:'event_id,user_id,event,timestamp\na,u1,view,2026-01-01T00:00:00Z\nb,u1,addtocart,2026-01-01T00:01:00Z\nc,u1,transaction,2026-01-01T00:02:00Z',conflict:'event_id,user_id,event,timestamp\na,u1,view,2026-01-01T00:00:00Z\na,u2,view,2026-01-01T00:00:00Z'};
const questions={data:'Check the grain, rejected records and reconciliation before using the report.',business:'Separate observed inputs from financial assumptions and identify who approves the decision.',product:'Check assignment, exposure and follow-up before interpreting a product effect.'};
function plan(input,audit){
  if(!input||!Object.hasOwn(roles,input.role)||!Object.hasOwn(goals,input.goal)||!(Object.hasOwn(samples,input.sample)||input.sample==='custom'))throw Error('Select a supported role, question and sample.');
  if(input.sample==='custom'&&(typeof input.csv!=='string'||new TextEncoder().encode(input.csv).length>50000))throw Error('Enter CSV text up to 50 KB.');
  const result=audit(input.sample==='custom'?input.csv:samples[input.sample],['view','addtocart','transaction']);
  if(!result||!['BLOCKED','REVIEW','CHECKS_PASSED'].includes(result.status))throw Error('The audit did not return a supported result.');
  const passed=result.status==='CHECKS_PASSED';
  return {version:1,mode:'Local rule-based workflow; no language model',evidence:input.sample==='custom'?'Visitor-supplied CSV, processed locally; provenance not verified':'Synthetic demonstration, not a review of visitor or employer data',role:roles[input.role],goal:goals[input.goal].label,sample:input.sample,
    steps:[{tool:'scope',result:questions[input.role]},{tool:'event_contract_audit',result:result.status,summary:result.summary},{tool:'route_evidence',result:passed?'Continue to the relevant work sample; a contract pass is not business approval.':'Investigate the audit findings before interpreting business results.'}],
    next:passed?{title:goals[input.goal].title,url:goals[input.goal].url}:{title:'Investigate event-contract failures',url:'/tools/event-audit/'},audit:result,
    approval:'Human review required. No launch, funding, outreach or hiring action is performed.'};
}
function population(mode){if(!['assigned','exposed'].includes(mode))throw Error('Unknown population.');const c=200/(mode==='assigned'?1000:900),t=260/(mode==='assigned'?1000:600);return {control:c,treatment:t,difference:t-c};}
if(typeof module!=='undefined'&&module.exports){module.exports={plan,population,goals};return;}
const form=document.getElementById('guide-form');if(!form)return;
const output=document.getElementById('guide-output'),exportButton=document.getElementById('guide-export');let current=null;
function el(tag,text){const node=document.createElement(tag);node.textContent=text;return node;}
function invalidate(){current=null;exportButton.disabled=true;output.replaceChildren(el('p','Settings changed. Run the workflow to generate a new review plan.'));document.getElementById('guide-custom').hidden=document.getElementById('guide-sample').value!=='custom';}
form.addEventListener('change',invalidate);form.addEventListener('input',invalidate);
form.addEventListener('submit',event=>{event.preventDefault();current=null;exportButton.disabled=true;try{
  if(!root.EventAudit)throw Error('The local audit tool is unavailable. Use the direct project links instead.');
  const input={role:document.getElementById('guide-role').value,goal:document.getElementById('guide-goal').value,sample:document.getElementById('guide-sample').value,csv:document.getElementById('guide-csv').value};
  current=plan(input,root.EventAudit.audit);output.replaceChildren(el('h3',current.role+' review'));
  const badge=el('p',current.audit.status.replaceAll('_',' '));badge.className='guide-status';output.append(badge);
  const list=document.createElement('ol');for(const step of current.steps)list.append(el('li',step.result));output.append(list);
  const summary=current.audit.summary;output.append(el('p',`${summary.inputRows} ${input.sample==='custom'?'submitted':'synthetic'} records checked; ${summary.provisionallyValidUniqueRows} provisionally valid unique records. ${current.audit.findings.length} finding categories.`));
  for(const finding of current.audit.findings)output.append(el('p',finding.message+' '+finding.action));
  const link=el('a',current.next.title+' →');link.href=current.next.url;output.append(link,el('p',current.approval));exportButton.disabled=false;
}catch(error){output.replaceChildren(el('p',error.message));}});
exportButton.addEventListener('click',()=>{if(!current)return;const url=URL.createObjectURL(new Blob([JSON.stringify(current,null,2)+'\n'],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='portfolio-review-plan.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
document.querySelectorAll('[data-population]').forEach(button=>button.addEventListener('click',()=>{
  const mode=button.dataset.population,r=population(mode);document.querySelectorAll('[data-population]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  const number=el('div',(r.difference*100).toFixed(2));number.className='preview-number';number.append(el('span','percentage points'));
  const note=mode==='assigned'?'Every assigned visitor stays in the denominator.':'Unequal exposure excludes nonpurchasers differently. This is selection, not stronger evidence.';
  document.getElementById('population-result').replaceChildren(number,el('p',`${(r.control*100).toFixed(2)}% control → ${(r.treatment*100).toFixed(2)}% treatment. ${note}`));
  document.getElementById('preview-control').style.setProperty('--bar',r.control*100+'%');document.getElementById('preview-treatment').style.setProperty('--bar',r.treatment*100+'%');
}));
document.querySelectorAll('[data-open-study]').forEach(link=>link.addEventListener('click',()=>{document.getElementById('supporting-studies').open=true;}));
})(typeof globalThis!=='undefined'?globalThis:this);

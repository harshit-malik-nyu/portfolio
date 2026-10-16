(function(root){
'use strict';
const audit=typeof module!=='undefined'&&module.exports?require('./tools/event-audit/audit.js').audit:root.EventAudit.audit;
const population=typeof module!=='undefined'&&module.exports?require('./guide.js').population:root.PortfolioGuide.population;
const evidence=[
  {id:'commerce',title:'Historical commerce analysis',url:'/projects/commerce-conversion/',text:'Retailrocket 2015 public data. 2,756,101 raw events; 17,672 distinct orders. 9,927 of 36,141 mature seven-day cart visitors purchased (27.47%). Prices, device and acquisition fields are unavailable. No causal impact or realized revenue claim. SQL, Python, cohort and commercial scenario evidence.'},
  {id:'reporting',title:'Reporting and BI handoff',url:'/projects/commerce-conversion/reporting/',text:'Reproducible reporting with reconciliation and a generated Excel handoff. Workbook generation and rendering are checked; native desktop Excel and native Power BI/Tableau execution have not been verified.'},
  {id:'operations',title:'Reporting recovery and business requirements',url:'/projects/commerce-conversion/operations/',text:'Executable examples cover replay, late arrivals, rejected data, rollback and restatement. Linked business requirements and acceptance criteria. These are independent work samples, not production client operations.'},
  {id:'ledger',title:'Assignment-to-decision ledger',url:'/projects/commerce-conversion/experiment/ledger/',text:'Synthetic fixture of 2,000 assigned visitors. All-assigned conversion is 20% control versus 26% treatment, a six percentage-point difference. Exposed-only comparison is 22.22% versus 43.33%, a 21.11 point difference. Unequal exposure selects populations differently. The decision is INVALID with required design gates false; no rollout approval or real treatment effect.'},
  {id:'audit',title:'Local event-contract audit',url:'/tools/event-audit/',text:'CSV tool checks event identity, timestamp, taxonomy and duplicates. Conflicting IDs exclude every affected record from provisional counts. A passing contract is not proof of complete instrumentation or business approval. Inputs can be processed locally in the visitor browser.'},
  {id:'roles',title:'Evidence by analyst role',url:'/role-evidence',text:'Data: grain, SQL, reconciliation, reporting quality. Business: requirements, financial assumptions, alternatives, acceptance criteria. Product: assignment, exposure, cohorts, experiment validity and guardrails. Work samples do not establish employer demand or guarantee hiring.'}
];
function object(x,keys){if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).some(k=>!keys.includes(k)))throw Error('Invalid tool arguments.');}
function execute(name,args){
  if(name==='search_evidence'){
    object(args,['query']);if(typeof args.query!=='string'||args.query.length>200)throw Error('Query must be at most 200 characters.');
    const terms=args.query.toLowerCase().match(/[a-z0-9]+/g)||[];
    return evidence.map(e=>({e,score:terms.reduce((n,t)=>n+Number((e.title+' '+e.text).toLowerCase().includes(t)),0)})).filter(r=>r.score>0).sort((a,b)=>b.score-a.score).slice(0,4).map(r=>r.e);
  }
  if(name==='read_evidence'){object(args,['id']);const e=evidence.find(e=>e.id===args.id);if(!e)throw Error('Unknown evidence ID.');return e;}
  if(name==='compare_populations'){object(args,[]);return {assigned:population('assigned'),exposed:population('exposed'),units:'Rates and absolute difference are fractions, not percentages.',limitation:'Synthetic example; descriptive differences do not establish a treatment effect.'};}
  if(name==='audit_sample'){
    object(args,['sample']);if(!['clean','conflict'].includes(args.sample))throw Error('Unknown sample.');
    const csv='event_id,user_id,event,timestamp\na,u1,view,2026-01-01T00:00:00Z\n'+(args.sample==='clean'?'b,u1,transaction,2026-01-01T00:01:00Z':'a,u2,view,2026-01-01T00:00:00Z');
    return {provenance:'Synthetic fixture',...audit(csv,['view','addtocart','transaction'])};
  }
  throw Error('Tool is not permitted.');
}
function auditInput(csv){
 if(typeof csv!=='string'||!csv.trim()||new TextEncoder().encode(csv).length>50000)throw Error('Attach CSV text of 1–50,000 bytes.');
 return {provenance:'Visitor-supplied CSV; source authenticity not verified',...audit(csv,['view','addtocart','transaction'])};
}
const api={evidence,execute,auditInput};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.EvidenceTools=api;
})(typeof globalThis!=='undefined'?globalThis:this);

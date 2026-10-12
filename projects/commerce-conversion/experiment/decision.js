'use strict';
// One fixed-horizon experiment, independent visitors, binary outcomes, 50:50 allocation.
// Four Wilson intervals use alpha=.05/4 (Bonferroni); coverage remains approximate.
const Z = 2.497705474412374;
function wilson(k,n,z=Z) {
  if (!Number.isSafeInteger(n)||n<=0||!Number.isSafeInteger(k)||k<0||k>n) throw new Error('Counts must be integers with 0 <= outcomes <= assigned.');
  const p=k/n,d=1+z*z/n,c=(p+z*z/(2*n))/d,h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;
  return [k===0?0:Math.max(0,c-h),k===n?1:Math.min(1,c+h)];
}
function erfc(x) {
  if(x===0)return 1;
  const t=1/(1+.3275911*x);
  return (((((1.061405429*t-1.453152027)*t)+1.421413741)*t-.284496736)*t+.254829592)*t*Math.exp(-x*x);
}
function evaluate(x) {
  const fields=['controlN','treatmentN','controlBuy','treatmentBuy','controlHarm','treatmentHarm','controlMature','treatmentMature'];
  for(const f of fields)if(!Number.isSafeInteger(x[f])||x[f]<0)throw new Error('Nonnegative integer required: '+f);
  const cn=x.controlN,tn=x.treatmentN;
  const cp=wilson(x.controlBuy,cn),tp=wilson(x.treatmentBuy,tn),ch=wilson(x.controlHarm,cn),th=wilson(x.treatmentHarm,tn);
  if(x.controlMature>cn||x.treatmentMature>tn)throw new Error('Mature visitors cannot exceed assigned visitors.');
  for(const f of ['futureVisitors','aov','margin','cost','maxHarm'])if(typeof x[f]!=='number'||!Number.isFinite(x[f])||x[f]<0)throw new Error('Finite nonnegative number required: '+f);
  if(!Number.isSafeInteger(x.futureVisitors)||x.futureVisitors<=0||x.margin>1||x.maxHarm>1)throw new Error('Invalid audience, margin, or guardrail ceiling.');
  for(const f of ['fixedHorizon','identityChecked','instrumentationChecked'])if(typeof x[f]!=='boolean')throw new Error('Explicit design confirmation required: '+f);
  const lift=x.treatmentBuy/tn-x.controlBuy/cn,liftInterval=[tp[0]-cp[1],tp[1]-cp[0]];
  const harm=x.treatmentHarm/tn-x.controlHarm/cn,harmInterval=[th[0]-ch[1],th[1]-ch[0]];
  const chi=(cn-tn)**2/(cn+tn),srmP=erfc(Math.sqrt(chi/2));
  if(!Number.isSafeInteger(cn+tn)||!Number.isFinite(x.futureVisitors*x.aov*x.margin+x.cost))throw new Error('Counts or economics exceed supported numeric precision.');
  const unit=x.aov*x.margin,breakEven=unit>0?x.cost/(x.futureVisitors*unit):null;
  const blockers=[];
  if(!x.fixedHorizon)blockers.push('The predeclared fixed analysis horizon has not been reached.');
  if(!x.identityChecked)blockers.push('Independent visitor identity and no arm crossover are unconfirmed.');
  if(!x.instrumentationChecked)blockers.push('Assignment and outcome instrumentation checks are unconfirmed.');
  if(x.controlMature!==cn||x.treatmentMature!==tn)blockers.push('Not all assigned visitors have complete seven-day follow-up; do not analyze a mature subset.');
  if(srmP<.001)blockers.push('Sample ratio mismatch: inspect assignment and exposure logging.');
  if([x.controlBuy,cn-x.controlBuy,x.treatmentBuy,tn-x.treatmentBuy,x.controlHarm,cn-x.controlHarm,x.treatmentHarm,tn-x.treatmentHarm].some(v=>v<10))blockers.push('Sparse outcomes: this approximate interval method cannot clear the decision gate.');
  const economicPass=breakEven!==null&&liftInterval[0]>breakEven,guardrailPass=harmInterval[1]<=x.maxHarm;
  let decision=blockers.length?'INVALID / NOT READY':!guardrailPass?'HOLD: GUARDRAIL':!economicPass?'HOLD: ECONOMICS':'ELIGIBLE FOR REVIEW';
  return {decision,blockers,srmP,lift,liftInterval,harm,harmInterval,breakEven,economicPass,guardrailPass,netPoint:lift*x.futureVisitors*unit-x.cost,netLower:liftInterval[0]*x.futureVisitors*unit-x.cost};
}
const base={controlN:40000,treatmentN:40000,controlBuy:11000,treatmentBuy:12400,controlHarm:400,treatmentHarm:400,controlMature:40000,treatmentMature:40000,futureVisitors:36141,aov:75,margin:.4,cost:8000,maxHarm:.005,fixedHorizon:true,identityChecked:true,instrumentationChecked:true};
const presets={
  'Clear economic gate':{...base},
  'Positive lift, weak economics':{...base,treatmentBuy:11400},
  'Conversion up, harm up':{...base,treatmentHarm:1000},
  'Broken randomization ratio':{...base,treatmentN:38000,treatmentMature:38000},
  'Incomplete follow-up':{...base,treatmentMature:37000},
  'Early peek':{...base,fixedHorizon:false}
};
if(typeof module!=='undefined')module.exports={wilson,evaluate,presets};
if(typeof document!=='undefined'){
 const form=document.querySelector('form'),picker=document.querySelector('#scenario'),result=document.querySelector('#result');
 const pct=v=>(100*v).toFixed(2)+' pp',money=v=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(v);
 for(const name of Object.keys(presets)){const op=document.createElement('option');op.textContent=name;picker.append(op);}
 function read(){const x={};for(const el of form.querySelectorAll('[data-field]'))x[el.name]=el.type==='checkbox'?el.checked:(el.value.trim()===''?NaN:Number(el.value));return x;}
 function show(){try{const r=evaluate(read());result.replaceChildren();const title=document.createElement('h2');title.textContent=r.decision;result.append(title);const p=document.createElement('p');p.textContent='Synthetic scenario only. Eligibility means review the evidence and operating constraints; it is not automatic rollout approval.';result.append(p);const values=[['Purchase-rate change',pct(r.lift)],['Adjusted lift interval',r.liftInterval.map(pct).join(' to ')],['Break-even lift',r.breakEven===null?'Not reachable':pct(r.breakEven)],['Guardrail-rate change',pct(r.harm)],['Adjusted guardrail interval',r.harmInterval.map(pct).join(' to ')],['SRM p-value (50:50)',r.srmP.toPrecision(4)],['Modeled net contribution',money(r.netPoint)],['Net at lower lift bound',money(r.netLower)]];const dl=document.createElement('dl');for(const [k,v]of values){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=k;dd.textContent=v;dl.append(dt,dd);}result.append(dl);for(const msg of r.blockers){const p=document.createElement('p');p.className='blocker';p.textContent=msg;result.append(p);}document.querySelector('#export').disabled=false;}catch(e){result.textContent=e.message;document.querySelector('#export').disabled=true;}}
 function apply(){const x=presets[picker.value];for(const el of form.querySelectorAll('[data-field]')){if(el.type==='checkbox')el.checked=x[el.name];else el.value=x[el.name];}show();}
 picker.addEventListener('change',apply);form.addEventListener('input',show);form.addEventListener('submit',e=>e.preventDefault());
 document.querySelector('#export').addEventListener('click',()=>{const x=read(),payload={schemaVersion:1,evidence:'synthetic user-edited scenario; not a real experiment',method:'Bonferroni-adjusted Wilson bounds, four binomial proportions; approximate joint 95% coverage',inputs:x,result:evaluate(x)};const a=document.createElement('a');const u=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)+'\n'],{type:'application/json'}));a.href=u;a.download='synthetic-experiment-decision.json';a.click();URL.revokeObjectURL(u);});apply();
}

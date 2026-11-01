/* Pure decision functions; monetary source values are integer cents. */
(function(root){
const actions=[
 {id:'collection',name:'Payment recovery',cost:300,hours:6,rate:.35,months:1,margin:1,basis:'One-time overdue cash'},
 {id:'onboarding',name:'Activation pilot',cost:700,hours:16,rate:.12,months:3,margin:.8,basis:'Three-month retained contribution'},
 {id:'renewal',name:'Renewal outreach',cost:1000,hours:20,rate:.08,months:3,margin:.8,basis:'Three-month retained contribution'}
];
function decide(pools,budget,hours,effect){
 if (![budget,hours,effect].every(Number.isFinite)||budget<0||hours<0||effect<0||effect>2) throw Error('Invalid assumptions');
 const rows=actions.map(a=>{
  if(!Number.isFinite(pools[a.id])||pools[a.id]<0) throw Error('Invalid pool');
  const pool=pools[a.id]/100,benefit=pool*a.rate*effect*a.months*a.margin;
  return {...a,pool,benefit,net:benefit-a.cost,feasible:a.cost<=budget&&a.hours<=hours,
   breakEven:pool?a.cost/(pool*a.months*a.margin):null};
 });
 const viable=rows.filter(r=>r.feasible&&r.net>0).sort((a,b)=>b.net-a.net||a.cost-b.cost);
 return {rows,winner:viable[0]||null};
}
const api={actions,decide}; if(typeof module!=='undefined')module.exports=api; else root.RevenueEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);

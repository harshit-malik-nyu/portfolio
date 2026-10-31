'use strict';
const {evaluate,presets}=require('../decision.js');
const axes={cost:[4000,8000,16000],futureVisitors:[18000,36141,72000],margin:[.2,.4,.6]};
function missingBounds({controlN,treatmentN,controlBuy,treatmentBuy,controlUnknown,treatmentUnknown}){
 const values=[controlN,treatmentN,controlBuy,treatmentBuy,controlUnknown,treatmentUnknown];
 if(values.some(x=>!Number.isSafeInteger(x)||x<0)||controlN===0||treatmentN===0||controlBuy>controlN-controlUnknown||treatmentBuy>treatmentN-treatmentUnknown)throw Error('Invalid disjoint known-success and unknown-outcome counts.');
 // Known negatives are N - successes - unknown. Every unknown may be 0 or 1.
 const lower=treatmentBuy/treatmentN-(controlBuy+controlUnknown)/controlN;
 const upper=(treatmentBuy+treatmentUnknown)/treatmentN-controlBuy/controlN;
 return {lower,upper,complete:controlUnknown===0&&treatmentUnknown===0,decision:controlUnknown||treatmentUnknown?'HOLD: UNKNOWN OUTCOMES':'COMPLETE COUNTS — APPLY EXPERIMENT GATES'};
}
function build(){
 const scenarios=Object.entries(presets).map(([name,base])=>{
  const cells=[];
  for(const cost of axes.cost)for(const futureVisitors of axes.futureVisitors)for(const margin of axes.margin){
   const inputs={...base,cost,futureVisitors,margin},r=evaluate(inputs);
   cells.push({cost,futureVisitors,margin,decision:r.decision,breakEven:r.breakEven,netPoint:r.netPoint,netLower:r.netLower,liftLower:r.liftInterval[0],blockers:r.blockers});
  }
  const eligible=cells.filter(c=>c.decision==='ELIGIBLE FOR REVIEW').length;
  return {name,inputs:base,cells,eligible,total:cells.length,assessment:eligible===cells.length?'ELIGIBLE ACROSS THIS GRID':eligible===0?'NO GRID CASE ELIGIBLE':'ASSUMPTION-SENSITIVE'};
 });
 const missing=[0,400,2000].map(unknown=>{
  const inputs={controlN:40000,treatmentN:40000,controlBuy:11000,treatmentBuy:12400,controlUnknown:unknown,treatmentUnknown:unknown};
  return {inputs,result:missingBounds(inputs)};
 });
 return {schemaVersion:1,evidence:'Synthetic experiments and illustrative planning assumptions. No observed revenue, causal impact or employer endorsement.',scope:'27 equally displayed planning combinations per experiment. Counts of passing combinations are not probabilities. Missing-outcome bounds are identification bounds, not confidence intervals.',axes,scenarios,missing};
}
module.exports={build,missingBounds};

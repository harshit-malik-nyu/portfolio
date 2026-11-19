// Deterministic browser baseline. Not a language model.
const stop=new Set('the a an to me where is it in of this that please show explain about can you go take back and then my on with how why does do'.split(' '));
const tokens=s=>new Set((s.toLowerCase().match(/[a-z0-9]+/g)||[]).filter(t=>!stop.has(t)));
export function plan(query,current,lesson){
 const q=query.toLowerCase(),terms=tokens(q),empty=status=>({status,actions:[],mode:'rules-baseline'});
 if(!query.trim()||query.length>500)return empty('error');
 if(/\b(buy|purchase|subscribe|comment|password|ignore|delete)\b/.test(q))return empty('unsupported');
 const ord=['first','second','third','fourth','fifth'];let step=ord.findIndex(w=>new RegExp('\\b'+w+'\\s+step\\b').test(q))+1;
 const m=q.match(/\bstep\s+([1-5])\b/);if(m)step=Number(m[1]);
 let target;
 if(step)target=lesson.segments.find(s=>s.step===step);
 else if(/\b(this|here|current)\b/.test(q))target=lesson.segments.find(s=>s.id===current);
 else{const rank=lesson.segments.map(s=>({s,score:[...tokens(s.tags.join(' '))].filter(x=>terms.has(x)).length*3+[...tokens(s.text)].filter(x=>terms.has(x)).length})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.s.start-b.s.start);
 if(!rank.length)return empty('unsupported');if(rank[1]?.score===rank[0].score)return empty('clarify');target=rank[0].s;}
 const actions=[];const add=tool=>actions.push({tool,segment_id:target.id,start:target.start,end:target.end,title:target.title,text:target.text});
 if(/\b(go|jump|take|find|back)\b/.test(q)&&!(/\b(don.t|do not|without)\b/.test(q)))add('seek');
 if(/\b(phone|send|save|card)\b/.test(q))add('prepare_card');if(!actions.length)add('explain');
 return {status:'ready',actions,mode:'rules-baseline'};
}
export function validActions(result,lesson){
 if(!result||!['ready','clarify','unsupported','error'].includes(result.status)||!Array.isArray(result.actions)||result.actions.length>3)return false;
 if((result.status==='ready')!==!!result.actions.length)return false;
 const used=new Set();return result.actions.every(a=>{const s=lesson.segments.find(s=>s.id===a.segment_id);if(!s||!['seek','explain','prepare_card'].includes(a.tool)||used.has(a.tool))return false;used.add(a.tool);return a.start===s.start&&a.end===s.end&&a.text===s.text;});
}

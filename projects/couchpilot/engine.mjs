// Deterministic browser policy. This is not language-model inference.
const stop=new Set('the a an to me where is it in of this that please show explain about can you go take back and then my on with how why does do step chapter part save send phone card jump move navigate playback anything just without not dont don t keep there as for should we what these those into which at'.split(' '));
const normalize=s=>s.normalize('NFKC').toLowerCase().replaceAll('’',"'");
const tokens=s=>new Set((normalize(s).match(/[a-z0-9]+/g)||[]).filter(t=>!stop.has(t)));
export function toolsFor(query){
 const q=normalize(query),no="(?:do not|don't|dont|never|without|no)\\s+(?:\\w+\\s+){0,2}";
 let seek=/\b(go|jump|seek|navigate|rewind|skip|find)\b|\btake (me|us)\b/.test(q),card=/\b(phone|send|save|card)\b/.test(q),explain=/\bexplain\b|^(?:why|how|what)\b/.test(q);
 if(new RegExp(no+'(?:jump|go|seek|navigate|rewind|skip|move|change|changing|find)\\b').test(q))seek=false;
 if(new RegExp(no+'(?:send|save|prepare|share)\\b').test(q))card=false;
 if(new RegExp(no+'explain\\b').test(q))explain=false;
 const tools=[...(seek?['seek']:[]),...(explain?['explain']:[]),...(card?['prepare_card']:[])];return tools.length?tools:['explain'];
}
export function plan(query,current,lesson){
 const empty=(status,reason)=>({status,actions:[],reason,mode:'rules-baseline'});
 if(typeof query!=='string'||!query.trim()||query.trim().length>500||!lesson.segments.some(s=>s.id===current))return empty('error','Use 1–500 characters and a valid chapter.');
 const q=normalize(query),terms=tokens(q);
 if(/\b(buy|purchase|subscribe|comment|password|ignore|delete|secret|system)\b|https?:\/\//.test(q))return empty('unsupported','Account actions, external links and instruction overrides are outside this lesson.');
 const ord=['first','second','third','fourth','fifth'];let step=ord.findIndex(w=>new RegExp('\\b'+w+'\\s+step\\b').test(q))+1;
 const m=q.match(/\bstep\s+(\d+)\b/),relative=q.match(/\b(next|previous)\s+(?:step|chapter)\b/);let target;
 if(m||step){if(m)step=Number(m[1]);if(step<1||step>5)return empty('unsupported','This lesson contains steps 1 through 5.');target=lesson.segments.find(s=>s.step===step);}
 else if(relative){step=lesson.segments.find(s=>s.id===current).step+(relative[1]==='next'?1:-1);target=lesson.segments.find(s=>s.step===step);if(!target)return empty('clarify','There is no chapter in that direction. Choose a listed chapter.');}
 const explicit=new Set((q.match(/\b(denominator|assignment|uncertainty|guardrails?|review|introduction)\b/g)||[]).map(x=>x==='guardrail'?'guardrails':x==='introduction'?'intro':x));
 if(explicit.size>1)return empty('clarify','Choose one chapter per request; these topics have different sources.');
 if(!target&&explicit.size)target=lesson.segments.find(s=>s.id===[...explicit][0]);
 if(!target&&/\b(this|here|current)\b/.test(q))target=lesson.segments.find(s=>s.id===current);
 if(!target){const ranked=lesson.segments.map(s=>({s,score:[...tokens(s.tags.join(' '))].filter(x=>terms.has(x)).length*4+[...tokens(s.text)].filter(x=>terms.has(x)).length})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.s.start-b.s.start);
 if(!ranked.length)return empty(!terms.size||/\b(?:the step|next|previous|there)\b/.test(q)?'clarify':'unsupported','Specify one chapter or ask about a lesson topic.');
 if(ranked[1]?.score===ranked[0].score)return empty('clarify','Two source chapters match equally. Choose one chapter.');target=ranked[0].s;}
 return {status:'ready',actions:toolsFor(q).map(tool=>({tool,segment_id:target.id,start:target.start,end:target.end,title:target.title,text:target.text})),mode:'rules-baseline'};
}
export function validActions(result,lesson,query=null){
 if(!result||!['ready','clarify','unsupported','error'].includes(result.status)||!Array.isArray(result.actions)||result.actions.length>3)return false;
 if((result.status==='ready')!==!!result.actions.length)return false;
 if(result.actions.some(a=>!a||typeof a!=='object'||Array.isArray(a)||Object.keys(a).sort().join(',')!=='end,segment_id,start,text,title,tool'))return false;
 if(new Set(result.actions.map(a=>a.segment_id)).size>1)return false;
 if(query!==null&&result.status==='ready'&&JSON.stringify(result.actions.map(a=>a.tool).sort())!==JSON.stringify(toolsFor(query).sort()))return false;
 const used=new Set();return result.actions.every(a=>{const s=lesson.segments.find(s=>s.id===a.segment_id);if(!s||!['seek','explain','prepare_card'].includes(a.tool)||used.has(a.tool))return false;used.add(a.tool);return a.start===s.start&&a.end===s.end&&a.title===s.title&&a.text===s.text;});
}

// Pure review state makes stale-action prevention testable without a browser.
export class ReviewSession {
 constructor(){this.revision=0;this.pending=null;this.request=null;}
 begin(query,current){this.revision++;this.pending=null;this.request={id:this.revision,query,current};return this.revision;}
 invalidate(){this.revision++;this.pending=null;this.request=null;}
 offer(id,result,lesson){if(!this.request||id!==this.revision||!validActions(result,lesson,this.request.query))return false;this.pending=result.status==='ready'?result:null;return true;}
 approve(query,current,lesson){const p=this.pending,r=this.request;this.pending=null;if(!p||!r||query!==r.query||current!==r.current||!validActions(p,lesson,query))return null;return p.actions;}
}

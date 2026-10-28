/* Explicitly started, in-memory demo telemetry. No network, cookies, or storage. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MeasurementLab=api;})(typeof globalThis==='undefined'?this:globalThis,()=>{
'use strict';
const names=['session_started','product_viewed','cart_added','checkout_failed','order_completed'];
function createSession(id,clock=()=>new Date().toISOString()){
 if(typeof id!=='string'||!/^s-[a-zA-Z0-9-]{1,80}$/.test(id))throw Error('Invalid demo session identity.');
 let state='assigned',events=[];
 function record(name){const stamp=clock();if(typeof stamp!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(stamp)||stamp.startsWith('0000-')||!Number.isFinite(Date.parse(stamp))||new Date(stamp).toISOString()!==stamp||(events.length&&stamp<events[events.length-1].occurred_at))throw Error('Invalid or regressed clock; event not recorded.');const row={event_id:id+'-'+(events.length+1),session_id:id,sequence:events.length+1,event:name,occurred_at:stamp};events.push(row);}
 record('session_started');
 function act(action){
  const transitions={assigned:{view:['viewed','product_viewed']},viewed:{cart:['carted','cart_added']},carted:{fail:['carted','checkout_failed'],complete:['completed','order_completed']},completed:{}};
  if(!Object.hasOwn(transitions[state],action))throw Error('Action is unavailable in this journey state.');
  if(events.length>=100)throw Error('Demo limit reached. Export or start a new session.');
  const [next,event]=transitions[state][action];record(event);state=next;return snapshot();
 }
 function snapshot(){return {schema_version:1,source:'local_demo',state,events:events.map(x=>({...x}))};}
 return {act,snapshot};
}
function validate(payload){
 const fail=message=>{throw Error(message);};
 if(!payload||Object.keys(payload).sort().join()!=='events,schema_version,source,state'||payload.schema_version!==1||!['local_demo','synthetic_fixture'].includes(payload.source)||!Array.isArray(payload.events)||payload.events.length<1||payload.events.length>100)fail('Invalid export envelope.');
 let state='assigned',last=-Infinity,session;
 for(let i=0;i<payload.events.length;i++){
  const e=payload.events[i];
  if(!e||Object.keys(e).sort().join()!=='event,event_id,occurred_at,sequence,session_id'||!names.includes(e.event)||e.sequence!==i+1)fail('Event fields or sequence are invalid.');
  if(typeof e.session_id!=='string'||!/^s-[a-zA-Z0-9-]{1,80}$/.test(e.session_id))fail('Invalid session identity.');
  session=session||e.session_id;if(e.session_id!==session||e.event_id!==session+'-'+(i+1))fail('Identity is inconsistent.');
  const t=Date.parse(e.occurred_at);if(typeof e.occurred_at!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(e.occurred_at)||e.occurred_at.startsWith('0000-')||!Number.isFinite(t)||new Date(t).toISOString()!==e.occurred_at||t<last)fail('Event clock is invalid or regressed.');last=t;
  if(i===0){if(e.event!=='session_started')fail('Missing session start.');continue;}
  const allowed={assigned:{product_viewed:'viewed'},viewed:{cart_added:'carted'},carted:{checkout_failed:'carted',order_completed:'completed'},completed:{}};
  if(!Object.hasOwn(allowed[state],e.event))fail('Invalid journey order.');state=allowed[state][e.event];
 }
 if(payload.state!==state)fail('Declared state disagrees with events.');
 return {events:payload.events.length,completed:state==='completed',failedAttempts:payload.events.filter(x=>x.event==='checkout_failed').length};
}
return {createSession,validate};
});

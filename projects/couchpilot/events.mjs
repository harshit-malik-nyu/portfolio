// Task identity is separate from async cancellation revisions.
export class SessionLog {
 constructor(sessionId,clock=()=>performance.now()){this.sessionId=sessionId;this.clock=clock;this.current=null;this.sequence=0;this.eventSequence=0;this.events=[];}
 start(mode){this.current=++this.sequence;this.record('request_started',{mode});return this.current;}
 record(event,detail={},requestId=this.current){
  const safe={};for(const k of ['mode','segment','tools','reason'])if(detail[k]!==undefined)safe[k]=detail[k];
  this.events.push({event_id:this.sessionId+'-'+(++this.eventSequence),session_id:this.sessionId,event,request_id:requestId,at_ms:Math.round(this.clock()),...safe});
  if(this.events.length>100)this.events.shift();
 }
 end(){this.current=null;}
 export(){return JSON.stringify(this.events,null,2);}
}

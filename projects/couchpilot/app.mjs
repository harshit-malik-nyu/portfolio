import {plan,validActions} from './engine.mjs';
const $=id=>document.getElementById(id),lesson=window.LESSON,player=$('player');
let current='intro',pending=null,previous=null,generation=0,abort=null,recognition=null;
const events=[],sessionId=crypto.randomUUID();let eventSequence=0;
function log(name,detail={}){events.push({event_id:sessionId+'-'+(++eventSequence),session_id:sessionId,event:name,request_id:generation,at_ms:Math.round(performance.now()),...detail});if(events.length>100)events.shift();}
const time=n=>`${Math.floor(n/60).toString().padStart(2,'0')}:${Math.floor(n%60).toString().padStart(2,'0')}`;
player.src=window.LESSON_VIDEO;
function setStatus(s){$('status').textContent=s;}
function update(){const t=player.currentTime||0,s=lesson.segments.find(s=>t>=s.start&&t<s.end)||lesson.segments.at(-1);current=s.id;$('clock').textContent=time(t);$('caption').textContent=s.text;document.querySelectorAll('[data-segment]').forEach(b=>b.setAttribute('aria-current',String(b.dataset.segment===current)));}
function seek(s){previous=player.currentTime;player.currentTime=s.start;$('undo').disabled=false;update();log('seek_applied',{segment:s.id});}
for(const s of lesson.segments){const b=document.createElement('button');b.dataset.segment=s.id;const t=document.createElement('time');t.textContent=time(s.start);b.append(t,document.createTextNode(s.title.replace(/Step \d · /,'')));b.addEventListener('click',()=>seek(s));$('chapters').append(b);}
player.addEventListener('timeupdate',update);player.addEventListener('loadedmetadata',()=>{const q=new URLSearchParams(location.hash.slice(1)).get('start');if(q&&Number.isFinite(Number(q)))player.currentTime=Math.min(119,Math.max(0,Number(q)));update();});
player.addEventListener('play',()=>{$('play-state').textContent='Playing';});player.addEventListener('pause',()=>{$('play-state').textContent='Paused';});
player.addEventListener('error',()=>{$('play-state').textContent='Playback unavailable';setStatus('The lesson could not load. The transcript and chapter evidence remain available.');});
$('undo').addEventListener('click',()=>{if(previous!==null){player.currentTime=previous;previous=null;$('undo').disabled=true;update();log('seek_undone');}});
function cancel(){generation++;abort?.abort();recognition?.abort();pending=null;$('proposal').hidden=true;$('submit').disabled=false;setStatus('Cancelled. Playback was not changed.');log('request_cancelled');}
$('cancel').addEventListener('click',cancel);document.addEventListener('keydown',e=>{if(e.key==='Escape')cancel();});
for(const b of document.querySelectorAll('[data-query]'))b.addEventListener('click',()=>{$('query').value=b.dataset.query;$('query').focus();});
$('request').addEventListener('submit',async e=>{
 e.preventDefault();const query=$('query').value.trim();if(!query){setStatus('Type a question or choose an example.');return;}
 const id=++generation;abort?.abort();abort=new AbortController();pending=null;$('proposal').hidden=true;$('answer').hidden=true;$('handoff').hidden=true;$('submit').disabled=true;setStatus('Finding evidence… Press Escape to cancel.');log('request_started',{mode:$('use-model').checked?'local-model':'rules'});
 try{let result;
 if($('use-model').checked){const r=await fetch('api/agent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query,current}),signal:abort.signal});result=await r.json();if(!r.ok)throw Error(result.error||'Local agent unavailable');}
 else result=plan(query,current,lesson);
 if(id!==generation)return;
 if(!validActions(result,lesson))throw Error('Unverified action was blocked.');
 $('trace').textContent=JSON.stringify(result,null,2);log(result.status==='ready'?'proposal_ready':result.status);
 if(result.status==='ready'){
 pending=result;$('action-list').replaceChildren();for(const a of result.actions){const d=document.createElement('div');d.className='action';const title=document.createElement('b'),p=document.createElement('p');title.textContent=({seek:'Jump to',explain:'Show source explanation',prepare_card:'Prepare phone card'})[a.tool]+' · '+time(a.start);p.textContent=a.title;d.append(title,p);$('action-list').append(d);}$('proposal').hidden=false;setStatus('Evidence found. Review the actions before applying.');
 }else setStatus(({clarify:'Which step do you mean? Choose a chapter or include its topic.',unsupported:'That request is outside this lesson or the supported actions. Try a chapter topic.',error:'The local model failed. No fallback or action was applied.'})[result.status]);
 }catch(err){if(id===generation)setStatus(err.name==='AbortError'?'Cancelled.':err.message+' No action was applied.');}finally{if(id===generation)$('submit').disabled=false;}
});
$('apply').addEventListener('click',()=>{
 if(!pending)return;const actions=pending.actions;pending=null;$('proposal').hidden=true;
 for(const a of actions){const s=lesson.segments.find(s=>s.id===a.segment_id);
  if(a.tool==='seek')seek(s);
  if(a.tool==='explain'){$('answer').replaceChildren();const small=document.createElement('small');small.textContent='SOURCE EXCERPT · '+time(s.start)+'–'+time(s.end);const p=document.createElement('p');p.textContent=s.text;$('answer').append(small,p);$('answer').hidden=false;}
  if(a.tool==='prepare_card'){$('handoff-text').textContent=s.title+' · '+time(s.start);const u=new URL('companion.html',document.baseURI);u.hash='segment='+encodeURIComponent(s.id);$('phone-link').href=u.href;$('qr').src='qr/'+s.id+'.svg';$('handoff').hidden=false;log('handoff_prepared',{segment:s.id});}
 }
 setStatus('Actions applied. Use Undo to return after a jump.');log('actions_applied',{tools:actions.map(a=>a.tool)});
});
const isLocal=['localhost','127.0.0.1'].includes(location.hostname);
if(isLocal){fetch('api/health').then(r=>r.ok?r.json():null).then(r=>{if(r?.local){$('model-option').hidden=false;$('engine-label').textContent='Local lab · choose rules or Ollama';}}).catch(()=>{});}
$('use-model').addEventListener('change',()=>{cancel();$('engine-label').textContent=$('use-model').checked?'Local model · Ollama':'Public preview · rules engine';});
const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
if(!Speech){$('voice').disabled=true;$('voice-note').textContent='Speech recognition is unavailable in this browser. Use typed input.';}
else{$('voice').addEventListener('click',()=>{recognition?.abort();recognition=new Speech();recognition.lang='en-US';recognition.interimResults=false;setStatus('Listening… Use your browser permission prompt.');recognition.onresult=e=>{$('query').value=e.results[0][0].transcript;setStatus('Transcript ready. Review it, then select Find my moment.');};recognition.onerror=()=>setStatus('Voice was unavailable or permission was declined. Typed input still works.');recognition.onend=()=>{if($('status').textContent.startsWith('Listening'))setStatus('No speech captured. Try again or type your request.');};recognition.start();});}
const ev=window.EVIDENCE||{},base=ev.baseline,model=ev.model;
function metric(label,value,note){const d=document.createElement('div');d.className='metric';const s=document.createElement('small'),v=document.createElement('strong'),p=document.createElement('p');s.textContent=label;v.textContent=value;p.textContent=note;d.append(s,v,p);return d;}
$('metrics').replaceChildren(metric('RULES BASELINE',base?.summary?`${base.summary.correct}/${base.summary.total}`:'Not measured','Authored task completion'),metric('LOCAL MODEL',model?.summary?`${model.summary.correct}/${model.summary.total}`:'Not measured',model?.model||'No model result claimed'),metric('MODEL WRONG JUMPS',model?.summary?String(model.summary.wrong_seek):'—','Measured proposals; human approval still required'));
for(const c of ev.cases||[]){const b=base?.results.find(x=>x.id===c.id),m=model?.results.find(x=>x.id===c.id),tr=document.createElement('tr');for(const [i,v] of [c.query,b?(b.correct?'Pass':'Fail'):'—',m?(m.correct?'Pass':'Fail'):'—',m?m.seconds.toFixed(2)+'s':'—'].entries()){const td=document.createElement('td');td.textContent=v;if(i===1||i===2)td.className=v==='Pass'?'pass':'fail';tr.append(td);}$('eval-rows').append(tr);}
for(const r of model?.results||[]){const o=document.createElement('option');o.value=r.id;o.textContent=r.id;$('case-select').append(o);}
function trace(){const r=model?.results.find(r=>r.id===$('case-select').value);$('model-trace').textContent=r?JSON.stringify(r,null,2):'No measured local-model trace is available.';}
$('case-select').addEventListener('change',trace);trace();update();
// Local session events only. No raw prompt or microphone audio is uploaded or persisted.
window.couchpilotExportEvents=()=>JSON.stringify(events,null,2);

$('export-events').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(events,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='couchpilot-session-events.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
$('chapters').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;const buttons=[...$('chapters').querySelectorAll('button')],i=buttons.indexOf(document.activeElement);if(i<0)return;e.preventDefault();buttons[(i+(['ArrowLeft','ArrowUp'].includes(e.key)?-1:1)+buttons.length)%buttons.length].focus();});

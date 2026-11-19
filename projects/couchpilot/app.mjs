import {plan,validActions,ReviewSession,toolsFor} from './engine.mjs';
import {SessionLog} from './events.mjs';
const $=id=>document.getElementById(id),lesson=window.LESSON,player=$('player');
let current='intro',previous=null,previousRequest=null,generation=0,abort=null,recognition=null,busy=false,listening=false;
const review=new ReviewSession();
const eventLog=new SessionLog(crypto.randomUUID());
const log=(name,detail={},requestId=eventLog.current)=>eventLog.record(name,detail,requestId);
const time=n=>`${Math.floor(n/60).toString().padStart(2,'0')}:${Math.floor(n%60).toString().padStart(2,'0')}`;
player.src=window.LESSON_VIDEO;
function setStatus(s){$('status').textContent=s;}
function update(){const t=player.currentTime||0,s=lesson.segments.find(s=>t>=s.start&&t<s.end)||lesson.segments.at(-1);if(current!==s.id&&(review.pending||busy))invalidate('The chapter changed. Submit again to review actions for the current context.');current=s.id;$('clock').textContent=time(t);$('caption').textContent=s.text;document.querySelectorAll('[data-segment]').forEach(b=>b.setAttribute('aria-current',String(b.dataset.segment===current)));}
function seek(s){previous=player.currentTime;previousRequest=eventLog.current;player.currentTime=s.start;$('undo').disabled=false;update();log('seek_applied',{segment:s.id});}
for(const s of lesson.segments){const b=document.createElement('button');b.dataset.segment=s.id;const t=document.createElement('time');t.textContent=time(s.start);b.append(t,document.createTextNode(s.title.replace(/Step \d · /,'')));b.addEventListener('click',()=>{invalidate('Chapter selected.');seek(s);});$('chapters').append(b);const article=document.createElement('article'),h=document.createElement('h3'),p=document.createElement('p');h.textContent=time(s.start)+' · '+s.title;p.textContent=s.text;article.append(h,p);$('transcript').append(article);}
player.addEventListener('timeupdate',update);player.addEventListener('loadedmetadata',()=>{const q=new URLSearchParams(location.hash.slice(1)).get('start');if(q&&Number.isFinite(Number(q)))player.currentTime=Math.min(119,Math.max(0,Number(q)));update();});
player.addEventListener('play',()=>{$('play-state').textContent='Playing';$('play-toggle').textContent='Pause lesson';});player.addEventListener('pause',()=>{$('play-state').textContent='Paused';$('play-toggle').textContent='Play lesson';});
$('play-toggle').addEventListener('click',()=>{if(player.paused)player.play().catch(()=>setStatus('Playback could not start. Use the source transcript below.'));else player.pause();});
player.addEventListener('error',()=>{$('play-state').textContent='Playback unavailable';setStatus('The lesson could not load. The transcript and chapter evidence remain available.');});
$('undo').addEventListener('click',()=>{if(previous!==null){invalidate('Jump undone.');player.currentTime=previous;previous=null;$('undo').disabled=true;update();log('seek_undone',{},previousRequest);}});
function invalidate(message){if((review.pending||busy||listening)&&eventLog.current!==null)log('request_cancelled',{reason:'invalidated'});eventLog.end();generation++;review.invalidate();abort?.abort();recognition?.abort();busy=false;listening=false;$('proposal').hidden=true;$('clarification').hidden=true;$('cancel-busy').hidden=true;$('submit').disabled=false;$('request').setAttribute('aria-busy','false');if(message)setStatus(message);}
function cancel(){invalidate('Cancelled. Playback was not changed.');$('query').focus();}
$('cancel').addEventListener('click',cancel);$('cancel-busy').addEventListener('click',cancel);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&(review.pending||busy||listening||!$('clarification').hidden))cancel();});
$('query').addEventListener('input',()=>{if(review.pending||busy||listening||!$('clarification').hidden)invalidate('Request edited. Submit it again to review fresh actions.');});
for(const b of document.querySelectorAll('[data-query]'))b.addEventListener('click',()=>{invalidate('Example selected. Submit it to review actions.');$('query').value=b.dataset.query;$('query').focus();});
$('request').addEventListener('submit',async e=>{
 e.preventDefault();const query=$('query').value.trim();if(!query){setStatus('Type a question or choose an example.');return;}
 invalidate();const id=++generation,reviewId=review.begin(query,current),requestCurrent=current;abort=new AbortController();busy=true;$('proposal').hidden=true;$('answer').hidden=true;$('handoff').hidden=true;$('submit').disabled=true;$('cancel-busy').hidden=false;$('request').setAttribute('aria-busy','true');setStatus('Finding evidence… Cancel request or press Escape to stop.');eventLog.start($('use-model').checked?'local-model':'rules');
 const timeout=setTimeout(()=>{if(id===generation)invalidate('The request timed out. No action was applied. Try again or choose a chapter.');},95000);
 try{let result;
 if($('use-model').checked){const r=await fetch('api/agent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query,current:requestCurrent}),signal:abort.signal});result=await r.json();if(!r.ok)throw Error(result.error||'Local agent unavailable');}
 else result=plan(query,requestCurrent,lesson);
 if(id!==generation)return;
 if(!validActions(result,lesson,query)||!review.offer(reviewId,result,lesson))throw Error('Unverified or stale action was blocked.');
 $('trace').textContent=JSON.stringify(result,null,2);log(result.status==='ready'?'proposal_ready':result.status);
 if(result.status==='ready'){
 $('action-list').replaceChildren();for(const a of result.actions){const d=document.createElement('div');d.className='action';const title=document.createElement('b'),p=document.createElement('p');title.textContent=({seek:'Jump to',explain:'Show source explanation',prepare_card:'Prepare phone card'})[a.tool]+' · '+time(a.start);p.textContent=a.title;d.append(title,p);$('action-list').append(d);}$('proposal').hidden=false;setStatus('Evidence found. Review the actions before applying.');$('apply').focus();
 }else{setStatus(result.reason||({clarify:'Which chapter do you mean?',unsupported:'That request is outside this lesson or the supported actions.',error:'The local model failed. No fallback or action was applied.'})[result.status]);if(result.status==='clarify')showClarification(query);}
 }catch(err){if(id===generation)setStatus(err.name==='AbortError'?'Cancelled.':err.message+' No action was applied.');}finally{clearTimeout(timeout);if(id===generation){busy=false;$('submit').disabled=false;$('cancel-busy').hidden=true;$('request').setAttribute('aria-busy','false');}}
});
function showClarification(query){$('clarify-options').replaceChildren();for(const s of lesson.segments){const b=document.createElement('button');b.textContent=s.title;b.addEventListener('click',()=>{const tools=toolsFor(query),parts=[];if(tools.includes('seek'))parts.push('Go to '+s.title);if(tools.includes('explain'))parts.push('Explain '+s.title);if(tools.includes('prepare_card'))parts.push('Save '+s.title+' as a card');log('clarification_selected',{segment:s.id});invalidate();$('query').value=parts.join(' and ');$('request').requestSubmit();});$('clarify-options').append(b);}$('clarification').hidden=false;$('clarify-options').querySelector('button')?.focus();}
$('apply').addEventListener('click',()=>{
 const actions=review.approve($('query').value.trim(),current,lesson);$('proposal').hidden=true;if(!actions){setStatus('This proposal is no longer current. Submit your request again.');return;}
 for(const a of actions){const s=lesson.segments.find(s=>s.id===a.segment_id);
  if(a.tool==='seek')seek(s);
  if(a.tool==='explain'){$('answer').replaceChildren();const small=document.createElement('small');small.textContent='SOURCE EXCERPT · '+time(s.start)+'–'+time(s.end);const p=document.createElement('p');p.textContent=s.text;$('answer').append(small,p);$('answer').hidden=false;}
  if(a.tool==='prepare_card'){$('handoff-text').textContent=s.title+' · '+time(s.start);const u=new URL('companion.html',document.baseURI);u.hash='segment='+encodeURIComponent(s.id);$('phone-link').href=u.href;$('qr').src='qr/'+s.id+'.svg';$('handoff').hidden=false;log('handoff_prepared',{segment:s.id});}
 }
 setStatus(actions.some(a=>a.tool==='seek')?'Actions applied. Use Undo to return after a jump.':'Actions applied. Playback position was kept.');log('actions_applied',{tools:actions.map(a=>a.tool)});eventLog.end();if(actions.some(a=>a.tool==='prepare_card'))$('handoff').focus();else if(actions.some(a=>a.tool==='explain'))$('answer').focus();else $('undo').focus();
});
const isLocal=['localhost','127.0.0.1'].includes(location.hostname);
if(isLocal){fetch('api/health').then(r=>r.ok?r.json():null).then(r=>{if(r?.local){$('model-option').hidden=false;$('engine-label').textContent='Local lab · choose rules or Ollama';}}).catch(()=>{});}
$('use-model').addEventListener('change',()=>{cancel();$('engine-label').textContent=$('use-model').checked?'Local model · Ollama':'Public preview · rules engine';});
const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
if(!Speech){$('voice').disabled=true;$('voice-note').textContent='Speech recognition is unavailable in this browser. Use typed input.';}
else{$('voice').addEventListener('click',()=>{invalidate();const voiceGeneration=generation;recognition=new Speech();recognition.lang='en-US';recognition.interimResults=false;listening=true;$('cancel-busy').hidden=false;setStatus('Listening… Use your browser permission prompt.');recognition.onresult=e=>{if(voiceGeneration!==generation)return;$('query').value=e.results[0][0].transcript;setStatus('Transcript ready. Review it, then select Find my moment.');$('query').focus();};recognition.onerror=()=>{if(voiceGeneration===generation)setStatus('Voice was unavailable or permission was declined. Typed input still works.');};recognition.onend=()=>{if(voiceGeneration===generation){listening=false;$('cancel-busy').hidden=true;}if(voiceGeneration===generation&&$('status').textContent.startsWith('Listening'))setStatus('No speech captured. Try again or type your request.');};try{recognition.start();}catch{setStatus('Voice could not start. Typed input still works.');}});}
const suites=window.EVIDENCE?.suites||[];
function metric(label,value,note){const d=document.createElement('div');d.className='metric';const s=document.createElement('small'),v=document.createElement('strong'),p=document.createElement('p');s.textContent=label;v.textContent=value;p.textContent=note;d.append(s,v,p);return d;}
for(const suite of suites){const o=document.createElement('option');o.value=suite.id;o.textContent=suite.title;$('suite-select').append(o);}
let activeSuite=null;
function selectSuite(){
 activeSuite=suites.find(s=>s.id===$('suite-select').value);if(!activeSuite)return;
 const {baseline:base,model,cases}=activeSuite;
 $('category-select').replaceChildren();for(const category of ['all',...new Set(cases.map(c=>c.category||'original-development'))]){const o=document.createElement('option');o.value=category;o.textContent=category==='all'?'All categories':category;$('category-select').append(o);}
 $('metrics').replaceChildren(metric('RULES BASELINE',base?.summary?`${base.summary.correct}/${base.summary.total}`:'Not measured','Exact authored task completion'),metric('LOCAL AI WORKFLOW',model?.summary?`${model.summary.correct}/${model.summary.total}`:'Not measured',model?.model||'No model result claimed'),metric('WRONG VALIDATED JUMPS',model?.summary?String(model.summary.wrong_seek):'—','Validated proposals; explicit approval still required'));
 $('suite-note').textContent=model?.summary?.policy_only_tasks!=null?`${model.summary.tasks_with_model_calls} tasks invoked the model; ${model.summary.policy_only_tasks} were handled by deterministic boundary checks. ${model.summary.repair_tasks} tasks used the bounded repair path. Authored development data, not independent validation.`:'Historical development run. Failures remain visible; these are not independent held-out tasks.';$('suite-note').textContent+=' '+cases.length+' cases; '+new Set(cases.map(c=>c.query+'|'+c.current)).size+' unique request/context pairs.';
 $('case-select').replaceChildren();for(const r of model?.results||[]){const o=document.createElement('option');o.value=r.id;o.textContent=(r.correct?'Pass · ':'Fail · ')+r.id;$('case-select').append(o);}renderRows();trace();
}
function renderRows(){
 if(!activeSuite)return;const {baseline:base,model,cases}=activeSuite,category=$('category-select').value,failures=$('failures-only').checked;$('eval-rows').replaceChildren();let count=0;
 for(const c of cases){const b=base?.results.find(x=>x.id===c.id),m=model?.results.find(x=>x.id===c.id);if(category!=='all'&&(c.category||'original-development')!==category||failures&&m?.correct)continue;count++;const tr=document.createElement('tr');
 for(const [i,v] of [c.query,b?(b.correct?'Pass':'Fail'):'—',m?(m.correct?'Pass':'Fail'):'—',m?(m.result.model_calls===0?'Policy only':m.seconds.toFixed(2)+'s'):'—'].entries()){const td=document.createElement('td');td.textContent=v;if(i===0){const context=document.createElement('small');context.className='case-context';context.textContent='Starting chapter: '+(lesson.segments.find(s=>s.id===c.current)?.title||c.current);td.append(context);}if(i===1||i===2)td.className=v==='Pass'?'pass':'fail';tr.append(td);}$('eval-rows').append(tr);}
 $('results-count').textContent=count?`${count} of ${cases.length} tasks shown.`:'No matching tasks. Clear the filters to see every result.';
}
function trace(){const r=activeSuite?.model?.results.find(r=>r.id===$('case-select').value);$('model-trace').textContent=r?JSON.stringify(r,null,2):'No measured local-model trace is available.';}
$('suite-select').addEventListener('change',selectSuite);$('category-select').addEventListener('change',renderRows);$('failures-only').addEventListener('change',renderRows);$('case-select').addEventListener('change',trace);selectSuite();update();
// Local session events only. No raw prompt or microphone audio is uploaded or persisted.
window.couchpilotExportEvents=()=>eventLog.export();

$('export-events').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([eventLog.export()],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='couchpilot-session-events.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
$('chapters').addEventListener('keydown',e=>{if(document.body.classList.contains('tv-mode')||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;const buttons=[...$('chapters').querySelectorAll('button')],i=buttons.indexOf(document.activeElement);if(i<0)return;e.preventDefault();buttons[(i+(['ArrowLeft','ArrowUp'].includes(e.key)?-1:1)+buttons.length)%buttons.length].focus();});

$('tv-mode').addEventListener('click',()=>{const active=document.body.classList.toggle('tv-mode');$('tv-mode').setAttribute('aria-pressed',String(active));$('tv-mode').textContent=active?'Exit TV focus mode':'TV focus mode';$('tv-help').hidden=!active;if(active)$('play-toggle').focus();});
document.addEventListener('keydown',e=>{
 if(!document.body.classList.contains('tv-mode')||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)||['TEXTAREA','INPUT','SELECT','VIDEO'].includes(document.activeElement?.tagName))return;
 const origin=document.activeElement?.getBoundingClientRect();if(!origin)return;
 const x=origin.x+origin.width/2,y=origin.y+origin.height/2,horizontal=['ArrowLeft','ArrowRight'].includes(e.key),sign=['ArrowLeft','ArrowUp'].includes(e.key)?-1:1;
 const options=[...$('experience').querySelectorAll('button:not(:disabled),textarea,summary')].filter(b=>b!==document.activeElement&&b.getClientRects().length).map(b=>{const r=b.getBoundingClientRect(),dx=r.x+r.width/2-x,dy=r.y+r.height/2-y;return {b,forward:(horizontal?dx:dy)*sign,side:Math.abs(horizontal?dy:dx)};}).filter(x=>x.forward>8).sort((a,b)=>(a.forward+a.side*3)-(b.forward+b.side*3));
 if(options.length){e.preventDefault();options[0].b.focus();}
});

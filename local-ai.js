// No external imports or model downloads occur until the visitor opts in.
const MODEL='Qwen2.5-1.5B-Instruct-q4f16_1-MLC';
const $=id=>document.getElementById(id),load=$('local-ai-load'),stop=$('local-ai-stop'),submit=$('local-ai-submit'),status=$('local-ai-status'),result=$('local-ai-result'),question=$('local-ai-question');
let engine=null,worker=null,controller=null,epoch=0,busy=false,timer;
const node=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n;};
function reset(message){epoch++;controller?.abort();controller=null;worker?.terminate();worker=null;engine=null;busy=false;clearTimeout(timer);load.disabled=false;load.hidden=false;stop.hidden=true;submit.disabled=true;result.removeAttribute('aria-busy');status.textContent=message;}
stop.addEventListener('click',()=>reset('Stopped. GPU memory released. Downloaded files may remain in your browser cache.'));
load.addEventListener('click',async()=>{
 if(busy)return;busy=true;const ticket=++epoch;load.disabled=true;stop.hidden=false;
 try{
  status.textContent='Checking WebGPU support…';
  if(!navigator.gpu)throw Error('This browser does not expose WebGPU. Use the instant workbench or a compatible browser.');
  const adapter=await navigator.gpu.requestAdapter();if(ticket!==epoch)return;
  if(!adapter||!adapter.features.has('shader-f16'))throw Error('This device does not expose the GPU features required by this model. The instant workbench remains available.');
  status.textContent='Downloading model runtime, then weights. This can take several minutes…';
  timer=setTimeout(()=>{if(ticket===epoch)reset('Setup timed out after ten minutes. Retry on a compatible device or use the workbench.');},600000);
  const {CreateWebWorkerMLCEngine}=await import('https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.86/lib/index.js');if(ticket!==epoch)return;
  worker=new Worker('/local-ai-worker.js',{type:'module'});
  worker.addEventListener('error',()=>{if(ticket===epoch)reset('Model worker could not start. Check network and browser compatibility; the workbench is available.');});
  const loaded=await CreateWebWorkerMLCEngine(worker,MODEL,{initProgressCallback:progress=>{if(ticket===epoch)status.textContent=progress.text;}},{context_window_size:4096});
  if(ticket!==epoch)return;engine=loaded;clearTimeout(timer);busy=false;load.hidden=true;submit.disabled=false;status.textContent='Model ready on this device. Questions are processed locally. Choose a prompt or write your own.';
 }catch(error){if(ticket===epoch)reset('Local AI unavailable: '+error.message);}
});
for(const button of document.querySelectorAll('[data-ai-question]'))button.addEventListener('click',()=>{question.value=button.dataset.aiQuestion;question.focus();});
$('local-ai-form').addEventListener('submit',async event=>{
 event.preventDefault();if(!engine||busy)return;busy=true;submit.disabled=true;controller=new AbortController();const ticket=epoch;const signal=controller.signal;
 result.replaceChildren();result.setAttribute('aria-busy','true');status.textContent='Investigating locally. Tool results appear as they run…';
 const trace=node('details','');trace.open=true;trace.append(node('summary','Live tool results'));result.append(trace);
 timer=setTimeout(()=>{if(ticket===epoch)reset('Investigation stopped after three minutes. Tool results remain available.');},180000);
 try{
  const answer=await window.LocalAgent.investigate(question.value,async payload=>{const reply=await engine.chat.completions.create(payload);return reply.choices?.[0]?.message?.content;},{signal,onStep:step=>{const detail=node('details','');detail.append(node('summary',step.tool),node('pre',JSON.stringify(step,null,2)));trace.append(detail);}});
  if(ticket!==epoch)return;
  const explanation=node('div','');explanation.append(node('h3','AI interpretation'),node('p',answer.answer));const sources=node('ul','');for(const source of answer.sources){const li=node('li',''),a=node('a',source.title);a.href=source.url;li.append(a);sources.append(li);}explanation.append(sources,node('p','Generated locally by Qwen 2.5 1.5B. Source links verify provenance, not the accuracy of every generated claim. Check the evidence before acting.'));result.prepend(explanation);trace.open=false;status.textContent='Investigation complete. Review the sources and expand the tool results.';
 }catch(error){if(ticket===epoch){result.prepend(node('p',error.message));status.textContent='No completed AI answer. Available tool results are shown below.';}}
 finally{if(ticket===epoch){clearTimeout(timer);controller=null;busy=false;submit.disabled=false;result.removeAttribute('aria-busy');}}
});

// No external imports or model downloads occur until the visitor opts in.
const MODEL='Qwen2.5-1.5B-Instruct-q4f16_1-MLC';
const COMPAT_MODEL='Qwen2.5-1.5B-Instruct-q4f32_1-MLC';
const $=id=>document.getElementById(id),load=$('local-ai-load'),stop=$('local-ai-stop'),submit=$('local-ai-submit'),status=$('local-ai-status'),result=$('local-ai-result'),question=$('local-ai-question');
let engine=null,worker=null,controller=null,epoch=0,busy=false,timer,modelLabel='';
const node=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n;};
function lockQuestion(locked){question.disabled=locked;$('local-ai-use-csv').disabled=locked;$('local-ai-csv').disabled=locked;for(const b of document.querySelectorAll('[data-ai-question]'))b.disabled=locked;}
function reset(message){epoch++;controller?.abort();controller=null;engine?.dispose?.();worker?.terminate();worker=null;engine=null;busy=false;clearTimeout(timer);load.disabled=false;load.hidden=false;stop.hidden=true;submit.disabled=true;$('local-ai-mode').disabled=false;lockQuestion(false);result.removeAttribute('aria-busy');status.textContent=message;}
stop.addEventListener('click',()=>reset('Stopped. Model worker released. Downloaded files may remain in your browser cache.'));
load.addEventListener('click',async()=>{
 if(busy)return;busy=true;controller=new AbortController();const ticket=++epoch;load.disabled=true;stop.hidden=false;const mode=$('local-ai-mode').value;$('local-ai-mode').disabled=true;
 try{
  const progressCallback=progress=>{if(ticket===epoch)status.textContent=progress.text;};
  timer=setTimeout(()=>{if(ticket===epoch)reset('Setup timed out after ten minutes. Retry or use the instant workbench.');},600000);
  if(mode==='cpu'){
   status.textContent='Loading CPU runtime and downloading the smaller model. First setup may take several minutes…';
   const {createCpuEngine}=await import('/local-ai-cpu.js');if(ticket!==epoch)return;
   worker=new Worker('/local-ai-cpu-worker.js',{type:'module'});
   const loaded=await createCpuEngine(worker,progressCallback,controller.signal);if(ticket!==epoch)return;
   engine=loaded;modelLabel='Qwen 2.5 0.5B · CPU';
  }else{
  status.textContent='Checking WebGPU support…';
  if(!navigator.gpu)throw Error('This browser does not expose WebGPU. Use the instant workbench or a compatible browser.');
  const adapter=await navigator.gpu.requestAdapter();if(ticket!==epoch)return;
  if(!adapter)throw Error('No usable WebGPU adapter is available in this browser. The instant workbench remains available.');
  const selectedModel=adapter.features.has('shader-f16')?MODEL:COMPAT_MODEL;
  status.textContent='Downloading model runtime, then weights. This can take several minutes…';
  const {CreateWebWorkerMLCEngine}=await import('https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.86/lib/index.js');if(ticket!==epoch)return;
  worker=new Worker('/local-ai-worker.js',{type:'module'});
  worker.addEventListener('error',()=>{if(ticket===epoch)reset('Model worker could not start. Check network and browser compatibility; the workbench is available.');});
  const loaded=await CreateWebWorkerMLCEngine(worker,selectedModel,{initProgressCallback:progressCallback},{context_window_size:4096});
  if(ticket!==epoch)return;engine=loaded;modelLabel='Qwen 2.5 1.5B · GPU';
  }
  clearTimeout(timer);busy=false;load.hidden=true;submit.disabled=false;status.textContent=modelLabel+' ready on this device. Questions are processed locally. Choose a prompt or write your own.';
 }catch(error){if(ticket===epoch)reset('Local AI unavailable: '+error.message);}
});
for(const button of document.querySelectorAll('[data-ai-question]'))button.addEventListener('click',()=>{question.value=button.dataset.aiQuestion;question.focus();});
$('local-ai-form').addEventListener('submit',async event=>{
 event.preventDefault();if(!engine||busy)return;busy=true;submit.disabled=true;controller=new AbortController();const ticket=epoch;const signal=controller.signal;
 const submittedQuestion=question.value;
 const attachedCsv=$('local-ai-use-csv').checked?$('local-ai-csv').value:undefined;
 lockQuestion(true);result.replaceChildren(node('h3','Your question'),node('p',submittedQuestion));result.setAttribute('aria-busy','true');status.textContent='Investigating locally. Tool results appear as they run…';
 let completedTools=0;const trace=node('details','');trace.open=true;trace.append(node('summary','Live tool results'));result.append(trace);
 timer=setTimeout(()=>{if(ticket===epoch)reset('Investigation stopped after three minutes. Tool results remain available.');},180000);
 try{
  const answer=await window.LocalAgent.investigate(submittedQuestion,async payload=>{const reply=await engine.chat.completions.create(payload);return {content:reply.choices?.[0]?.message?.content,origin:reply.decisionOrigin||(modelLabel.includes('GPU')?'model-selected':'model-output')};},{signal,csv:attachedCsv,onStep:step=>{const detail=node('details','');detail.append(node('summary',step.tool+' · '+step.decisionOrigin),node('pre',JSON.stringify(step,null,2)));trace.append(detail);completedTools++;status.textContent='Completed '+completedTools+' tool steps. Continuing the local investigation…';}});
  if(ticket!==epoch)return;
  const cpu=modelLabel.includes('CPU'),explanation=node('div','');
  const metrics=node('div','');metrics.className='investigation-metrics';
  const metric=(value,label)=>{const card=node('div','');card.append(node('strong',value),node('span',label));metrics.append(card);};
  const auditStep=answer.trace.find(t=>['audit_input','audit_sample'].includes(t.tool)&&t.result.summary);
  if(auditStep){metric(auditStep.result.status.replaceAll('_',' '),'Event contract status');metric(String(auditStep.result.summary.provisionallyValidUniqueRows)+' / '+auditStep.result.summary.inputRows,'Provisionally valid / checked');}
  metric(String(answer.trace.filter(t=>t.decisionOrigin==='model-selected').length),'Model-selected tool steps');
  explanation.append(metrics);explanation.append(node('h3',cpu?'Retrieved evidence brief':'AI interpretation'));for(const paragraph of answer.answer.split('\n\n'))explanation.append(node('p',paragraph));const sources=node('ul','');for(const source of answer.sources){const li=node('li',''),a=node('a',source.title);a.href=source.url;li.append(a);sources.append(li);}explanation.append(sources,node('p',cpu?'CPU workflow: the model selects discretionary tools; application rules execute required checks and enforce stopping. This brief is assembled from retrieved facts, not model-written prose. Relevance still requires your judgment.':'Generated locally by '+modelLabel+'. Source links verify provenance, not the accuracy of every generated claim. Check the evidence before acting.'));const download=node('button','Download investigation record ↓');download.type='button';download.className='text-button';
  download.addEventListener('click',()=>{const record={version:1,question:submittedQuestion,model:modelLabel,mode:cpu?'Model-selected discretionary tools; application-required checks; source-assembled brief':'Model tool selection and generated interpretation',answer:answer.answer,sources:answer.sources,trace:answer.trace,completionOrigin:answer.completionOrigin,input:attachedCsv===undefined?'No CSV attached':'Visitor-attached CSV; raw rows omitted',limitations:'Independent work samples. Synthetic calculations are not causal impact. Source retrieval does not prove employer adoption.'};const url=URL.createObjectURL(new Blob([JSON.stringify(record,null,2)+'\n'],{type:'application/json'}));const a=node('a','');a.href=url;a.download='portfolio-investigation.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  explanation.append(download);result.prepend(explanation);trace.open=false;status.textContent='Investigation complete. Review the sources and expand the tool results.';
 }catch(error){if(ticket===epoch){result.prepend(node('p',error.message));if(error.modelOutput){const rejected=node('details','');rejected.append(node('summary','Rejected model output · not a verified answer'),node('pre',error.modelOutput));result.append(rejected);}status.textContent='No completed AI answer. Available tool results are shown below.';}}
 finally{if(ticket===epoch){clearTimeout(timer);controller=null;busy=false;submit.disabled=false;lockQuestion(false);result.removeAttribute('aria-busy');}}
});

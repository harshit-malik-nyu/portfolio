// Browser CPU inference; loaded only after an explicit visitor download action.
import { pipeline, env, TextStreamer, LogitsProcessor, LogitsProcessorList } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js';
import './cpu-planner.js';
import './verification/contrast-planner.js';
const strategy=new URL(self.location.href).searchParams.get('strategy');
const contrast=['contrast','free'].includes(strategy);
const qwen3=new URL(self.location.href).searchParams.get('model')==='qwen3';
const nli=new URL(self.location.href).searchParams.get('model')==='nli';
const modelId=nli?'Xenova/nli-deberta-v3-xsmall':qwen3?'onnx-community/Qwen3-0.6B-ONNX':'onnx-community/Qwen2.5-0.5B-Instruct';
env.allowLocalModels = false;
// Single-thread WASM works without cross-origin isolation or SharedArrayBuffer.
env.backends.onnx.wasm.numThreads = 1;
let generator;
self.onmessage = async ({data}) => {
  const {id, type, messages} = data;
  try {
    if (type === 'load') {
      generator = await pipeline(nli?'zero-shot-classification':'text-generation', modelId, {
        device: 'wasm', dtype: 'q8',
        progress_callback: p => self.postMessage({type:'progress', text: p.status === 'progress' ? `${p.file}: ${Math.round(p.progress)}%` : `${p.status}: ${p.file || 'model runtime'}`})
      });
      self.postMessage({id, result: true});
    } else if (type === 'complete' && generator) {
      const generate=async(prompt,limit,extra={})=>{
        let characters=0;
        const streamer=new TextStreamer(generator.tokenizer,{skip_prompt:true,skip_special_tokens:true,callback_function:text=>{
          characters+=text.length;self.postMessage({type:'progress',text:`Generating locally · ${characters} characters decoded…`});
        }});
        const input=qwen3?generator.tokenizer.apply_chat_template(prompt,{tokenize:false,add_generation_prompt:true,enable_thinking:false}):prompt;
        const output=await generator(input,{max_new_tokens:limit,do_sample:false,return_full_text:false,streamer,...extra});
        const text=output[0]?.generated_text,content=typeof text==='string'?text:text?.at(-1)?.content;
        if(typeof content!=='string')throw Error('Unexpected model output.');return content;
      };
      const planner=self.CpuPlanner;
      const permitted=planner.allowedSelections(messages);
      let selection=permitted[0];
      if(permitted.length>1&&nli){
        const labels=['finishing the review without further evidence','analyst role skills and responsibilities','historical commerce journeys and purchase cohorts','experiment assignment, exposure and launch decisions','Excel workbook deliverables, dashboards and report reconciliation','restarting failed data processing, replay, rollback and operational acceptance','event identity, timestamps and data contract validation','calculating assigned versus exposed conversion','testing conflicting event records','testing valid event records','auditing visitor-supplied CSV'];
        const options=permitted.map(i=>labels[i]);
        const ranked=await generator(messages[1].content,options,{hypothesis_template:'The visitor wants evidence about {}.',multi_label:false});
        selection=permitted[options.indexOf(ranked.labels[0])];
      }else if(permitted.length>1){
        const tokens=permitted.map(n=>{const ids=generator.tokenizer.encode(planner.selectionToken(n),{add_special_tokens:false});if(ids.length!==1)throw Error('Action digit must encode to one token.');return Number(ids[0]);});
        class ActionMenu extends LogitsProcessor {_call(inputIds,logits){return planner.maskLogits(logits,tokens);}}
        const processors=new LogitsProcessorList();processors.push(new ActionMenu());
        selection=planner.parseSelection(await generate(contrast?self.ContrastPlanner.prompt(messages,planner):planner.decisionPrompt(messages),strategy==='free'?8:1,strategy==='free'?{}:{logits_processor:processors}));
      }
      if(!permitted.includes(selection))throw Error('Model selected an unavailable action.');
      let content;
      if(selection===0){
        const sourceIds=planner.sourceIds(messages);if(!sourceIds.length)throw Error('CPU model tried to answer without evidence.');
        content=JSON.stringify({action:'answer',argument:'',answer:planner.evidenceBrief(messages),sourceIds});
      }else content=planner.toolAction(selection);
      self.postMessage({id,result:{content,origin:permitted.length===1?'application-required':'model-selected'}});
    } else throw Error('The CPU model is not ready.');
  } catch (error) { self.postMessage({id, error: error.message}); }
};

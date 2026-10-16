// Browser CPU inference; loaded only after an explicit visitor download action.
import { pipeline, env, TextStreamer, LogitsProcessor, LogitsProcessorList } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js';
import './cpu-planner.js';
env.allowLocalModels = false;
// Single-thread WASM works without cross-origin isolation or SharedArrayBuffer.
env.backends.onnx.wasm.numThreads = 1;
let generator;
self.onmessage = async ({data}) => {
  const {id, type, messages} = data;
  try {
    if (type === 'load') {
      generator = await pipeline('text-generation', 'onnx-community/Qwen2.5-0.5B-Instruct', {
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
        const output=await generator(prompt,{max_new_tokens:limit,do_sample:false,return_full_text:false,streamer,...extra});
        const text=output[0]?.generated_text,content=typeof text==='string'?text:text?.at(-1)?.content;
        if(typeof content!=='string')throw Error('Unexpected model output.');return content;
      };
      const planner=self.CpuPlanner;
      const permitted=planner.allowedSelections(messages);
      const tokens=permitted.map(n=>{const ids=generator.tokenizer.encode(String(n),{add_special_tokens:false});if(ids.length!==1)throw Error('Action digit must encode to one token.');return Number(ids[0]);});
      class ActionMenu extends LogitsProcessor {_call(inputIds,logits){return planner.maskLogits(logits,tokens);}}
      const processors=new LogitsProcessorList();processors.push(new ActionMenu());
      const selection=planner.parseSelection(await generate(planner.decisionPrompt(messages),1,{logits_processor:processors}));
      let content;
      if(selection===0){
        const sourceIds=planner.sourceIds(messages);if(!sourceIds.length)throw Error('CPU model tried to answer without evidence.');
        content=JSON.stringify({action:'answer',argument:'',answer:await generate(planner.answerPrompt(messages),180),sourceIds});
      }else content=planner.toolAction(selection);
      self.postMessage({id, result:content});
    } else throw Error('The CPU model is not ready.');
  } catch (error) { self.postMessage({id, error: error.message}); }
};

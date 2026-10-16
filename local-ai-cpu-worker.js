// Browser CPU inference; loaded only after an explicit visitor download action.
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js';
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
      const output = await generator(messages, {max_new_tokens: 360, do_sample: false, return_full_text: false});
      const text = output[0]?.generated_text;
      const content = typeof text === 'string' ? text : text?.at(-1)?.content;
      if (typeof content !== 'string') throw Error('Unexpected model output.');
      self.postMessage({id, result: content});
    } else throw Error('The CPU model is not ready.');
  } catch (error) { self.postMessage({id, error: error.message}); }
};

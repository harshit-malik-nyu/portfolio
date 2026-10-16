export async function createCpuEngine(worker, onProgress, signal) {
  let sequence = 0;
  let disposed = false;
  const pending = new Map();
  const dispose = () => { disposed = true; for (const p of pending.values()) p.reject(Error('CPU model stopped.')); pending.clear(); };
  if(signal?.aborted)dispose();else signal?.addEventListener('abort',dispose,{once:true});
  worker.addEventListener('message', ({data}) => {
    if (data.type === 'progress') { onProgress({text: data.text}); return; }
    const p = pending.get(data.id); if (!p) return;
    pending.delete(data.id); data.error ? p.reject(Error(data.error)) : p.resolve(data.result);
  });
  worker.addEventListener('error', dispose);
  const request = (type, messages) => new Promise((resolve, reject) => {
    if(disposed){reject(Error('CPU model stopped.'));return;}
    const id = ++sequence; pending.set(id, {resolve, reject}); worker.postMessage({id, type, messages});
  });
  await request('load');
  return {dispose, chat:{completions:{create:async ({messages})=>({choices:[{message:{content:await request('complete',messages)}}]})}}};
}

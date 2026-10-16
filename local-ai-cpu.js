export async function createCpuEngine(worker, onProgress) {
  let sequence = 0;
  const pending = new Map();
  const dispose = () => { for (const p of pending.values()) p.reject(Error('CPU model stopped.')); pending.clear(); };
  worker.addEventListener('message', ({data}) => {
    if (data.type === 'progress') { onProgress({text: data.text}); return; }
    const p = pending.get(data.id); if (!p) return;
    pending.delete(data.id); data.error ? p.reject(Error(data.error)) : p.resolve(data.result);
  });
  worker.addEventListener('error', dispose);
  const request = (type, messages) => new Promise((resolve, reject) => {
    const id = ++sequence; pending.set(id, {resolve, reject}); worker.postMessage({id, type, messages});
  });
  await request('load');
  return {dispose, chat:{completions:{create:async ({messages})=>({choices:[{message:{content:await request('complete',messages)}}]})}}};
}

// Public UMD/browser bundles must be loaded as classic scripts, not ESM imports.
const pending = new Map();

export function loadClassicScript(src, ready) {
  if (typeof document === 'undefined') return Promise.reject(new Error('Scripts require a browser.'));
  if (ready()) return Promise.resolve();
  if (pending.has(src)) return pending.get(src);

  const promise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    let timer;
    const finish = error => {
      clearTimeout(timer);
      script.onload = script.onerror = null;
      if (error) { script.remove(); reject(error); }
      else resolve();
    };
    script.src = src;
    script.async = true;
    script.onload = () => finish(ready() ? null : new Error(`Script did not initialize: ${src}`));
    script.onerror = () => finish(new Error(`Failed to load script: ${src}`));
    timer = setTimeout(() => finish(new Error(`Script load timed out: ${src}`)), 12_000);
    document.head.append(script);
  });
  pending.set(src, promise);
  // Failed loads are removed so the existing Retry actions can try again.
  promise.catch(() => { if (pending.get(src) === promise) pending.delete(src); });
  return promise;
}

import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

// MathJax loads these files at runtime, outside the JS module graph.
// Serve exactly the installed worker and speech maps; emit them in production.
export function mathjaxAssets() {
  const require = createRequire(import.meta.url);
  const root = path.join(path.dirname(require.resolve('@mathjax/src/package.json')), 'bundle/sre');
  const names = ['speech-worker.js', ...readdirSync(path.join(root, 'mathmaps'))
    .filter(name => name.endsWith('.json')).map(name => `mathmaps/${name}`)];
  const assets = new Map(names.map(name => [`/static/mathjax/sre/${name}`, readFileSync(path.join(root, name))]));
  return {
    name: 'local-mathjax-speech-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = (req.url || '').split('?')[0];
        const source = assets.get(pathname);
        if (!source || !['GET', 'HEAD'].includes(req.method)) return next();
        res.setHeader('Content-Type', pathname.endsWith('.json') ? 'application/json' : 'text/javascript');
        res.end(req.method === 'HEAD' ? undefined : source);
      });
    },
    generateBundle() {
      for (const [name, source] of assets) this.emitFile({ type: 'asset', fileName: name.slice(1), source });
    },
  };
}

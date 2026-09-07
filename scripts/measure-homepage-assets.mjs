import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { resolve } from 'node:path';
const dist = resolve('docs/.vuepress/dist');
const measure = path => {
  const bytes = readFileSync(`${dist}/${path.replace(/^\//, '')}`);
  return { path, bytes: bytes.length, gzip: gzipSync(bytes, { level: 9 }).length };
};
const report = {};
for (const route of ['index.html', 'zh/index.html']) {
  const html = readFileSync(`${dist}/${route}`, 'utf8');
  const paths = new Set();
  for (const [tag] of html.matchAll(/<(?:script|link)\b[^>]*>/g)) {
    if (tag.startsWith('<script') || /rel="(?:modulepreload|stylesheet)"/.test(tag)) {
      const match = tag.match(/(?:href|src)="(\/assets\/[^\"]+)"/);
      if (match) paths.add(match[1]);
    }
  }
  report[route] = [...paths].sort().map(measure);
}
for (const file of readdirSync(`${dist}/assets`).filter(name => name.startsWith('Home-'))) report[file] = measure(`assets/${file}`);
mkdirSync('.ai/artifacts/homepage', { recursive: true });
writeFileSync('.ai/artifacts/homepage/assets.json', JSON.stringify(report, null, 2) + '\n');
console.log('Initial script/modulepreload + stylesheet assets deduplicated; async layout listed separately. gzip level 9, bytes (not observed transfer size).');

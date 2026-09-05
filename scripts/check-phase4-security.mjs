import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseTiobeHtml } from "../docs/.vuepress/tiobe-parser.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const validHtml = `
  <table id="top20">
    <thead><tr><th>Now</th><th colspan="2"><img src=x onerror=alert(1)>Language</th></tr></thead>
    <tbody><tr>
      <td>1</td><td>2</td><td></td><td><img src="/images/Python.png" alt="Python"></td>
      <td>Python</td><td>20%</td><td>+1%</td>
    </tr></tbody>
  </table>
  <script>$('#container').highcharts({series: [
    {name: 'Python', data: [[Date.UTC(2026, 7, 31), 20.5]]}
  ]});</script>
`;

const parsed = parseTiobeHtml(validHtml);
assert.deepEqual(parsed.series, [{
  name: "Python",
  data: [[Date.UTC(2026, 7, 31), 20.5]],
}]);
assert.deepEqual(parsed.top20.thead, [
  { text: "Now", colspan: 1 },
  { text: "Language", colspan: 2 },
]);
assert.equal(parsed.top20.tbody[0].langName, "Python");
assert.equal(JSON.stringify(parsed).includes("onerror"), false);

const executableHtml = validHtml.replace(
  "]}\n  ]});",
  "]}, {name: 'Injected', data: (globalThis.__phase4Executed = true, [])}\n  ]});",
);
globalThis.__phase4Executed = false;
assert.throws(() => parseTiobeHtml(executableHtml), /executable|unsupported/);
assert.equal(globalThis.__phase4Executed, false);

const langSource = read("docs/.vuepress/components/Lang.vue");
assert.doesNotMatch(langSource, /\beval\s*\(/);
assert.doesNotMatch(langSource, /v-html/);

const remoteSource = read("docs/.vuepress/remote-data.mjs");
for (const allowedUrl of [
  "https://www.tiobe.com/tiobe-index/",
  "https://leetcode.com/lucienzhang/",
  "https://leetcode.com/graphql",
  "https://leetcode.cn/graphql",
]) {
  assert.equal(remoteSource.split(allowedUrl).length - 1, 1, `${allowedUrl} must appear exactly once`);
}
assert.doesNotMatch(remoteSource, /export function proxyRequest/);

const pseudoSource = read("docs/.vuepress/components/Pseudo.vue");
const leetCodeSource = read("docs/.vuepress/components/LeetCode.vue");
const pseudoCss = read("docs/.vuepress/public/static/css/pseudocode.min.css");
assert.doesNotMatch(pseudoSource, /import\(["']https:/);
assert.match(pseudoSource, /@mathjax\/src\/es5\/tex-svg\.js/);
assert.match(pseudoSource, /mathjax:\s*["']\/static\/mathjax["']/);
assert.doesNotMatch(leetCodeSource, /cdnjs\.cloudflare\.com/);
assert.doesNotMatch(pseudoCss, /@import\s+url\(https:/);

console.log("Phase 4 security checks passed.");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

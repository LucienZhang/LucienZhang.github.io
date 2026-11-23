<script setup>
import logo from '../../../public/logo.svg?raw';
const props = defineProps({ zh: Boolean });
const d = logo.match(/ d="([^"]+)"/)[1];
// Parse the absolute M/L/C/Z path into anchors and Bézier handles for the blueprint view.
const tokens = d.match(/[MLCZ]|-?\d*\.?\d+(?:e-?\d+)?/g);
const anchors = [], handles = [], cuts = [];
let cursor = null, start = null;
for (let i = 0; i < tokens.length;) {
  const command = tokens[i++];
  const take = () => [Number(tokens[i++]), Number(tokens[i++])];
  if (command === 'M') { cursor = start = take(); anchors.push(cursor); }
  else if (command === 'L') { const next = take(); cuts.push([cursor, next]); cursor = next; anchors.push(cursor); }
  else if (command === 'C') {
    const c1 = take(), c2 = take(), end = take();
    handles.push([cursor, c1], [end, c2]);
    cursor = end; anchors.push(cursor);
  } else if (command === 'Z') { cursor = start; }
}
const round = n => Math.round(n * 10) / 10;
const segments = handles.length / 2;
</script>

<template>
  <figure class="blueprint">
    <svg viewBox="-760 -450 1520 900" role="img" aria-labelledby="blueprint-title blueprint-desc">
      <title id="blueprint-title">{{ props.zh ? 'Logo 的贝塞尔结构' : 'Bézier construction of the logo' }}</title>
      <desc id="blueprint-desc">{{ props.zh ? `由 ${segments} 段三次贝塞尔曲线和 ${cuts.length} 条切口直线组成的 ∞ 标志，标出锚点与控制柄。` : `The ∞ logo drawn from ${segments} cubic Bézier curves and ${cuts.length} cut lines, with anchors and control handles marked.` }}</desc>
      <defs>
        <pattern id="blueprint-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="rgb(32 35 31 / 7%)" stroke-width="2" /></pattern>
      </defs>
      <rect x="-760" y="-450" width="1520" height="900" fill="url(#blueprint-grid)" />
      <line class="axis" x1="-740" y1="0" x2="740" y2="0" /><line class="axis" x1="0" y1="-430" x2="0" y2="430" />
      <path class="shape" :d="d" />
      <g class="handles"><line v-for="([a, b], i) in handles" :key="i" :x1="round(a[0])" :y1="round(a[1])" :x2="round(b[0])" :y2="round(b[1])" /></g>
      <g class="controls"><circle v-for="([, b], i) in handles" :key="i" :cx="round(b[0])" :cy="round(b[1])" r="9" /></g>
      <g class="cuts"><line v-for="([a, b], i) in cuts" :key="i" :x1="round(a[0])" :y1="round(a[1])" :x2="round(b[0])" :y2="round(b[1])" /></g>
      <g class="anchors"><rect v-for="(a, i) in anchors" :key="i" :x="round(a[0]) - 9" :y="round(a[1]) - 9" width="18" height="18" /></g>
    </svg>
    <figcaption>
      <span>{{ props.zh ? `${segments} 段三次贝塞尔 + ${cuts.length} 条切口` : `${segments} cubic Béziers + ${cuts.length} cut lines` }}</span>
      <span>k = 4(√2 − 1)/3</span>
      <span>{{ props.zh ? '切线与曲率连续 · 脚本校验' : 'G² continuity · checked by script' }}</span>
    </figcaption>
  </figure>
</template>

<style scoped>
.blueprint { margin: 0; padding: 20px; border-radius: 16px; background: #fffdf8; border: 1px solid #ddd7cc; }
svg { display: block; width: 100%; height: auto; }
.axis { stroke: rgb(32 35 31 / 16%); stroke-width: 2; stroke-dasharray: 8 10; }
.shape { fill: rgb(182 56 36 / 10%); stroke: #b63824; stroke-width: 4; }
.handles line { stroke: rgb(32 35 31 / 45%); stroke-width: 2.5; }
.controls circle { fill: #fffdf8; stroke: #b63824; stroke-width: 4; }
.cuts line { stroke: #20231f; stroke-width: 5; stroke-dasharray: 14 10; }
.anchors rect { fill: #20231f; }
figcaption { display: flex; flex-wrap: wrap; gap: 6px 10px; margin-top: 12px; font: 12px/16px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: #64665f; }
figcaption span { padding: 4px 8px; border-radius: 999px; background: #f0eadf; }
</style>

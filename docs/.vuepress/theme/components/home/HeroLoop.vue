<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import logo from '../../../public/logo.svg?raw';
const props = defineProps({ zh: Boolean });
const ribbon = logo.match(/ d="([^"]+)"/)[1];
// Centre line of the ribbon: right loop first, then left loop, crossing at the origin.
const track = 'M0 0C70 -100 200 -273 337 -273C480 -273 597 -150 597 0C597 150 480 273 337 273C200 273 70 100 0 0C-70 -100 -200 -273 -337 -273C-480 -273 -597 -150 -597 0C-597 150 -480 273 -337 273C-200 273 -70 100 0 0Z';
// Fractions of the track length where the comet passes each station (Bézier arc lengths of `track`).
const stations = [
  { at: 0.1293, x: 337, y: -273, top: true, en: 'Spec', zh: '规格' },
  { at: 0.3707, x: 337, y: 273, top: false, en: 'Build', zh: '生成' },
  { at: 0.6293, x: -337, y: -273, top: true, en: 'Verify', zh: '校验' },
  { at: 0.8707, x: -337, y: 273, top: false, en: 'Ship', zh: '上线' },
];
const layers = [['tail', 260], ['mid', 110], ['head', 34]];
const root = ref(null), paused = ref(false);
let observer;
onMounted(() => {
  observer = new IntersectionObserver(([entry]) => { paused.value = !entry.isIntersecting; });
  observer.observe(root.value);
});
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <figure ref="root" class="hero-loop" :class="{ paused }">
    <svg viewBox="-720 -420 1440 840" role="img" :aria-labelledby="`loop-title loop-desc`">
      <title id="loop-title">{{ props.zh ? '无限循环：规格、生成、校验、上线' : 'An endless loop: spec, build, verify, ship' }}</title>
      <desc id="loop-desc">{{ props.zh ? '网站标志的 ∞ 形状上，一束光沿着四个阶段循环流动。' : 'A light travels around the site’s ∞ logo through four stages.' }}</desc>
      <defs>
        <radialGradient id="loop-glow"><stop offset="0" stop-color="#e8553a" stop-opacity=".34" /><stop offset="1" stop-color="#e8553a" stop-opacity="0" /></radialGradient>
        <filter id="loop-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14" /></filter>
      </defs>
      <ellipse class="glow" cx="0" cy="0" rx="720" ry="420" fill="url(#loop-glow)" />
      <path class="ribbon" :d="ribbon" />
      <path class="track" :d="track" pathLength="1000" />
      <path v-for="[name, length] in layers" :key="name" class="comet" :class="name" :d="track" pathLength="1000" :style="{ '--len': length }" />
      <path class="comet head halo" :d="track" pathLength="1000" style="--len: 34" filter="url(#loop-blur)" />
      <g v-for="(s, i) in stations" :key="s.en" class="station" :style="{ '--at': s.at }">
        <circle class="ring" :cx="s.x" :cy="s.y" r="22" />
        <circle class="node" :cx="s.x" :cy="s.y" r="10" />
        <text class="index" :x="s.x" :y="s.top ? s.y - 100 : s.y + 62" text-anchor="middle">0{{ i + 1 }}</text>
        <text class="label" :x="s.x" :y="s.top ? s.y - 44 : s.y + 112" text-anchor="middle">{{ props.zh ? s.zh : s.en.toUpperCase() }}</text>
      </g>
    </svg>
    <figcaption>{{ props.zh ? '规格 → agent 实现 → 自动校验 → 审阅上线，循环往复。' : 'spec → agent build → automated checks → review & ship, on repeat.' }}</figcaption>
  </figure>
</template>

<style scoped>
.hero-loop { margin: 0; min-width: 0; }
svg { display: block; width: 100%; height: auto; overflow: visible; }
.ribbon { fill: rgb(182 56 36 / 16%); stroke: rgb(232 85 58 / 38%); stroke-width: 2; }
.track { fill: none; stroke: rgb(239 234 224 / 14%); stroke-width: 2; stroke-dasharray: 2 10; }
.comet { fill: none; stroke-linecap: round; stroke-dasharray: var(--len) calc(1000 - var(--len)); animation: comet 9s linear infinite; }
.comet.tail { stroke: rgb(232 85 58 / 22%); stroke-width: 10; }
.comet.mid { stroke: rgb(240 120 90 / 55%); stroke-width: 9; }
.comet.head { stroke: #ffd2c2; stroke-width: 9; }
.comet.halo { stroke: #ff6a4d; stroke-width: 28; opacity: .9; }
@keyframes comet { from { stroke-dashoffset: var(--len); } to { stroke-dashoffset: calc(var(--len) - 1000); } }
.station .ring { fill: none; stroke: rgb(232 85 58 / 0%); stroke-width: 2; }
.station .node { fill: #1a1916; stroke: rgb(239 234 224 / 45%); stroke-width: 3; }
.station text { font: 600 46px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; letter-spacing: .08em; fill: #a8a397; }
.station .index { font-size: 30px; fill: rgb(168 163 151 / 70%); }
.station .node, .station .ring, .station .label { animation: 9s linear infinite; animation-delay: calc(var(--at) * 9s - 9s); }
.station .node { animation-name: station-node; }
@keyframes station-node { 0%, 9% { fill: #e8553a; stroke: #ffd2c2; } 22%, 100% { fill: #1a1916; stroke: rgb(239 234 224 / 45%); } }
.station .label { animation-name: station-label; }
@keyframes station-label { 0%, 12% { fill: #efeae0; } 26%, 100% { fill: #a8a397; } }
.station .ring { transform-box: fill-box; transform-origin: center; animation-name: station-ring; }
@keyframes station-ring { 0% { stroke: rgb(232 85 58 / 85%); transform: scale(.7); } 16%, 100% { stroke: rgb(232 85 58 / 0%); transform: scale(2); } }
.paused .comet, .paused .station * { animation-play-state: paused; }
figcaption { margin-top: 8px; font: 13px/20px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: #a8a397; text-align: center; }
@media (prefers-reduced-motion: reduce) {
  .comet { display: none; }
  .station .node, .station .ring, .station .label { animation: none; }
  .station .node { fill: #e8553a; stroke: #ffd2c2; }
  .station .label { fill: #efeae0; }
}
</style>

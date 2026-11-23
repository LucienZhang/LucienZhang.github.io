<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { parseWeights, predict, normalise } from '../../../lib/digits/model.mjs';
import meta from '../../../lib/digits/meta.json';
const props = defineProps({ zh: Boolean });
const t = (en, cn) => props.zh ? cn : en;
const SIZE = 280;
const canvas = ref(null), root = ref(null), view = ref(null);
const status = ref('idle'); // idle | loading | ready | failed
const probabilities = ref(null), elapsed = ref(null), drawn = ref(false);
const guess = computed(() => probabilities.value ? probabilities.value.indexOf(Math.max(...probabilities.value)) : null);
const confidence = computed(() => probabilities.value ? Math.round(Math.max(...probabilities.value) * 100) : null);
const percent = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 });
const kb = Math.round(meta.bytes / 1024);
let model, loading, context, drawing = false, last = null, frame = 0, observer, sample = 0;
// Stroke paths in canvas pixels, used by the "Try a sample" button and keyboard users.
const samples = [
  [[[92, 96], [112, 70], [150, 60], [186, 78], [192, 114], [174, 150], [138, 186], [100, 222], [86, 236], [202, 232]]],
  [[[84, 74], [196, 74], [172, 122], [148, 172], [128, 228]]],
  [[[92, 80], [132, 60], [176, 74], [182, 110], [142, 136], [186, 160], [182, 206], [136, 228], [90, 212]]],
];

function load() {
  if (model || loading) return loading;
  status.value = 'loading';
  loading = fetch('/static/models/digits-mlp.bin')
    .then(response => { if (!response.ok) throw new Error(String(response.status)); return response.arrayBuffer(); })
    .then(buffer => { model = parseWeights(buffer); status.value = 'ready'; infer(); })
    .catch(() => { status.value = 'failed'; loading = null; });
  return loading;
}
function infer() {
  if (!model || !drawn.value) return;
  const data = context.getImageData(0, 0, SIZE, SIZE).data;
  const ink = new Float32Array(SIZE * SIZE);
  for (let i = 0; i < ink.length; i++) ink[i] = data[i * 4 + 3] / 255;
  const input = normalise(ink, SIZE);
  if (!input) { probabilities.value = null; return; }
  paintView(input);
  const start = performance.now();
  probabilities.value = predict(model, input);
  elapsed.value = performance.now() - start;
}
function paintView(input) {
  const target = view.value?.getContext('2d');
  if (!target) return;
  const image = target.createImageData(28, 28);
  input.forEach((v, i) => { const c = Math.round(v * 255); image.data.set([c, Math.round(c * 0.86), Math.round(c * 0.8), 255], i * 4); });
  target.putImageData(image, 0, 0);
}
function schedule() { if (!frame) frame = requestAnimationFrame(() => { frame = 0; infer(); }); }
function point(event) {
  const box = canvas.value.getBoundingClientRect();
  return [(event.clientX - box.left) * SIZE / box.width, (event.clientY - box.top) * SIZE / box.height];
}
function stroke(from, to) {
  context.beginPath(); context.moveTo(...from); context.lineTo(...to); context.stroke();
  drawn.value = true;
}
function down(event) {
  if (event.button > 0) return;
  load();
  drawing = true; last = point(event);
  canvas.value.setPointerCapture?.(event.pointerId);
  stroke(last, last); schedule();
}
function move(event) {
  if (!drawing) return;
  const next = point(event);
  stroke(last, next); last = next; schedule();
}
function up() { drawing = false; last = null; schedule(); }
function clear() {
  context.clearRect(0, 0, SIZE, SIZE);
  view.value?.getContext('2d').clearRect(0, 0, 28, 28);
  drawn.value = false; probabilities.value = null; elapsed.value = null;
}
async function trySample() {
  clear();
  for (const line of samples[sample]) line.slice(1).forEach((p, i) => stroke(line[i], p));
  sample = (sample + 1) % samples.length;
  await load();
  infer();
}
onMounted(() => {
  context = canvas.value.getContext('2d', { willReadFrequently: true });
  Object.assign(context, { lineWidth: 20, lineCap: 'round', lineJoin: 'round', strokeStyle: '#fff' });
  observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { load(); observer.disconnect(); } }, { rootMargin: '200px' });
  observer.observe(root.value);
});
onBeforeUnmount(() => { observer?.disconnect(); cancelAnimationFrame(frame); });
defineExpose({ trySample, clear });
</script>

<template>
  <article ref="root" class="digit-demo" aria-labelledby="digit-title">
    <header>
      <p class="kicker"><span class="live" aria-hidden="true"></span>{{ t('Live · machine learning in your browser', '现场 · 浏览器内机器学习') }}</p>
      <h3 id="digit-title">{{ t('Handwritten digit recognition', '手写数字识别') }}</h3>
      <p>{{ t('Draw a digit from 0 to 9. A neural network I trained on MNIST predicts it as you draw — on your device, with nothing uploaded.', '在下面写一个 0–9 的数字。我在 MNIST 上训练的神经网络会边写边识别——就在你的设备上运行，不上传任何数据。') }}</p>
    </header>
    <div class="body">
      <div class="pad">
        <canvas ref="canvas" :width="SIZE" :height="SIZE" role="img" :aria-label="t('Drawing pad for a digit', '数字手写板')" @pointerdown="down" @pointermove="move" @pointerup="up" @pointercancel="up" @lostpointercapture="up" />
        <p v-if="!drawn" class="hint" aria-hidden="true">{{ t('Draw here', '在这里写') }}</p>
        <div class="pad-actions">
          <button type="button" class="sample" @click="trySample">{{ t('Try a sample', '试一个示例') }}</button>
          <button type="button" class="clear" :disabled="!drawn" @click="clear">{{ t('Clear', '清空') }}</button>
        </div>
      </div>
      <div class="readout">
        <p class="guess" role="status" aria-live="polite">
          <span class="digit" :class="{ empty: guess === null }">{{ guess ?? '?' }}</span>
          <span class="guess-text">
            <template v-if="guess !== null">{{ t('Prediction', '识别结果') }} <strong>{{ guess }}</strong> · {{ t('confidence', '置信度') }} {{ confidence }}%</template>
            <template v-else-if="status === 'failed'">{{ t('The model could not be loaded. Refresh to try again.', '模型加载失败，请刷新重试。') }}</template>
            <template v-else-if="status === 'loading'">{{ t(`Loading model (${kb} KB)…`, `正在加载模型（${kb} KB）…`) }}</template>
            <template v-else>{{ t('Waiting for your stroke.', '等你落笔。') }}</template>
          </span>
        </p>
        <ol class="bars" :aria-label="t('Probability for each digit', '各数字的概率')">
          <li v-for="(p, digit) in (probabilities ?? Array(10).fill(0))" :key="digit" :class="{ top: digit === guess }">
            <span class="label">{{ digit }}</span>
            <span class="track"><span class="fill" :style="{ transform: `scaleX(${p})` }" /></span>
            <span class="value">{{ probabilities ? percent.format(p) : '—' }}</span>
          </li>
        </ol>
        <div class="model-view">
          <canvas ref="view" width="28" height="28" aria-hidden="true" />
          <p>{{ t('What the model sees: your stroke scaled into a 20×20 box and centred by mass on a 28×28 grid, exactly how MNIST was prepared.', '模型实际看到的输入：笔画缩放进 20×20 的框，再按质心居中到 28×28 网格——和 MNIST 的制作方式一致。') }}</p>
        </div>
      </div>
    </div>
    <footer>
      <span>MLP 784→128→10</span><span>int8 · {{ kb }} KB</span><span>{{ t('test accuracy', '测试准确率') }} {{ percent.format(meta.testAccuracy) }}</span><span v-if="elapsed !== null">{{ t('inference', '推理') }} {{ elapsed.toFixed(2) }} ms</span>
      <a href="/ml/mnist.html" :hreflang="props.zh ? 'en' : undefined">{{ t('LeNet-5 notes', 'LeNet-5 笔记（英文）') }} →</a>
    </footer>
  </article>
</template>

<style scoped>
.digit-demo { display: flex; flex-direction: column; gap: 20px; height: 100%; padding: 28px; border-radius: 16px; background: radial-gradient(120% 90% at 100% 0%, rgb(232 85 58 / 16%), transparent 55%), #12110f; color: #efeae0; border: 1px solid rgb(239 234 224 / 10%); }
.kicker { display: flex; align-items: center; gap: 8px; margin: 0 0 10px; font: 600 12px/16px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; letter-spacing: .08em; text-transform: uppercase; color: #f08d77; }
.live { width: 8px; height: 8px; border-radius: 50%; background: #e8553a; box-shadow: 0 0 0 0 rgb(232 85 58 / 60%); animation: live 2s ease-out infinite; }
@keyframes live { to { box-shadow: 0 0 0 10px rgb(232 85 58 / 0%); } }
h3 { margin: 0; color: #efeae0 !important; font-size: 24px !important; line-height: 32px !important; }
header p:last-child { margin-top: 8px; color: #c9c4b8; max-width: 56ch; }
.body { display: grid; grid-template-columns: minmax(0, 280px) minmax(0, 1fr); gap: 28px; align-items: start; }
.pad { position: relative; }
canvas { display: block; width: 100%; aspect-ratio: 1; border-radius: 12px; touch-action: none; cursor: crosshair; background: linear-gradient(rgb(239 234 224 / 5%) 1px, transparent 1px) 0 0 / 28px 28px, linear-gradient(90deg, rgb(239 234 224 / 5%) 1px, transparent 1px) 0 0 / 28px 28px, #1d1b18; box-shadow: inset 0 0 0 1px rgb(239 234 224 / 14%); }
.hint { position: absolute; inset: 0 0 56px; display: grid; place-items: center; margin: 0; pointer-events: none; font: 14px/20px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: rgb(239 234 224 / 35%); }
.pad-actions { display: flex; gap: 8px; margin-top: 12px; }
.pad-actions button { flex: 1; min-height: 44px; border-radius: 8px !important; border: 1px solid rgb(239 234 224 / 24%) !important; color: #efeae0 !important; background: rgb(239 234 224 / 4%) !important; font-size: 14px; }
.pad-actions button:hover:not(:disabled) { background: rgb(239 234 224 / 12%) !important; }
.readout { min-width: 0; }
.guess { display: flex; align-items: center; gap: 16px; margin: 0 0 16px; min-height: 88px; }
.digit { display: grid; place-items: center; width: 88px; height: 88px; flex: none; border-radius: 16px; font: 700 64px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: #fff; background: linear-gradient(140deg, #e8553a, #8f2a18); box-shadow: 0 10px 40px -10px rgb(232 85 58 / 70%); }
.digit.empty { background: #24221e; color: rgb(239 234 224 / 30%); box-shadow: none; }
.guess-text { color: #c9c4b8; font-size: 14px; line-height: 20px; }
.guess-text strong { color: #efeae0; }
.bars { display: grid; gap: 6px; margin: 0; padding: 0; list-style: none; font: 13px/18px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
.bars li { display: grid; grid-template-columns: 16px minmax(0, 1fr) 52px; gap: 10px; align-items: center; color: #a8a397; }
.track { height: 8px; border-radius: 4px; background: rgb(239 234 224 / 8%); overflow: hidden; }
.fill { display: block; height: 100%; background: #6f6a5f; transform-origin: left; transition: transform .15s ease-out; }
.top { color: #efeae0; }
.top .fill { background: linear-gradient(90deg, #b63824, #ff7a5c); }
.value { text-align: right; }
.model-view { display: flex; gap: 14px; align-items: center; margin-top: 18px; padding-top: 16px; border-top: 1px solid rgb(239 234 224 / 10%); }
.model-view canvas { width: 84px; height: 84px; flex: none; image-rendering: pixelated; border-radius: 6px; background: #000; box-shadow: inset 0 0 0 1px rgb(239 234 224 / 14%); }
.model-view p { margin: 0; font-size: 12.5px; line-height: 19px; color: #a8a397; }
footer { display: flex; flex-wrap: wrap; gap: 6px 10px; align-items: center; margin-top: auto; font: 12px/16px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: #a8a397; }
footer span { padding: 4px 8px; border-radius: 999px; background: rgb(239 234 224 / 6%); }
footer a { margin-left: auto; color: #f08d77 !important; padding: 12px 0; }
@media (max-width: 767px) {
  .digit-demo { padding: 20px; }
  .body { grid-template-columns: 1fr; gap: 16px; }
  .pad { max-width: 320px; width: 100%; }
  .guess { min-height: 72px; }
  .digit { width: 72px; height: 72px; font-size: 52px; }
  footer a { margin-left: 0; }
}
@media (prefers-reduced-motion: reduce) { .live { animation: none; } .fill { transition: none; } }
</style>

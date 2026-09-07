<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { calendarMonth } from './calendar.mjs';
const props = defineProps({ id: String, title: String, description: String, series: Array, month: Number, start: Number, end: Number, markers: Array, payoffs: Array, zh: Boolean, calendarStart: String, compact: Boolean });
const emit = defineEmits(['select']);
const svg = ref(null), width = ref(1000);
const hovered = ref(null);
watch(() => [props.series, props.month, props.calendarStart], () => hovered.value = null);
let observer;
onMounted(() => { width.value = Math.max(240, svg.value.getBoundingClientRect().width); observer = new ResizeObserver(entries => { width.value = Math.max(240, entries[0].contentRect.width); }); observer.observe(svg.value); });
onBeforeUnmount(() => observer?.disconnect());
const height = computed(() => props.compact ? (width.value < 480 ? 160 : 240) : width.value < 480 ? 400 : 360);
const top = props.compact ? 32 : 94, bottom = computed(() => height.value - (props.compact ? 48 : 72));
const bounds = computed(() => {
  const values = props.series.flatMap(s => s.points.map(p => p.value));
  const lo = Math.min(0, ...values), hi = Math.max(0, ...values);
  return { lo, hi: hi === lo ? lo + 1 : hi };
});
const x = m => 64 + (Math.max(props.start,m) - props.start) / Math.max(1, props.end - props.start) * (width.value - 80);
const y = v => bottom.value - (v - bounds.value.lo) / (bounds.value.hi - bounds.value.lo) * (bottom.value - top);
const points = s => s.points.map(p => `${x(p.month)},${y(p.value)}`).join(' ');
const ticks = computed(() => Array.from({length: 4}, (_, i) => bounds.value.lo + (bounds.value.hi - bounds.value.lo) * i / 3));
const fmt = v => new Intl.NumberFormat(props.zh ? 'zh-CN' : 'en-US', {maximumFractionDigits: 1, notation: 'compact'}).format(v);
const amount = v => new Intl.NumberFormat('en-US', {maximumFractionDigits:0}).format(v);
const date = m => props.compact ? (props.zh ? `第${m}期` : `Month ${m}`) : calendarMonth(props.calendarStart,m);
const axisLabel = m => props.compact ? `${new Intl.NumberFormat(props.zh ? 'zh-CN' : 'en-US', {maximumFractionDigits: 1}).format(m / 12)}${props.zh ? '年' : 'y'}` : date(m);
const axisMonths = computed(() => [...new Set([props.start, Math.round((props.start+props.end)/2), props.end])]);
const annotations = computed(() => {
  const valuesAt = m => props.series.map((s,i) => ({label:props.series.length === 1 ? 'A−B' : ['A','B'][i],value:s.points.find(p=>p.month===m)?.value ?? 0}));
  const items = [];
  function add(m, label, values, special=false) {
    const existing = items.find(p=>p.month === m);
    if(existing) { existing.label += ' · '+label; return; }
    items.push({month:m,label,values,special});
  }
  add(props.month,props.zh ? '所选' : 'Selected',valuesAt(props.month));
  props.markers.forEach(p => add(p.month,props.zh ? `${props.series.length===1?'零点':'交点'} ≈ ${p.month.toFixed(1)}期` : `${props.series.length===1?'Zero':'Crossing'} ≈ ${p.month.toFixed(1)}`, [{label:props.series.length === 1 ? 'A−B' : 'A=B',value:p.value}],true));
  props.payoffs.filter(p=>p.month !== props.end).forEach(p=>add(p.month,p.label,valuesAt(p.month)));
  add(props.start,props.zh ? '起点' : 'Start',valuesAt(props.start));
  add(props.end,props.zh ? '终点' : 'End',valuesAt(props.end));
  const boxWidth = Math.min(188,width.value-16);
  return items.map(p => {
    const px=x(p.month), py=y(p.values[0].value), boxHeight=28+p.values.length*18;
    const cx=Math.max(8,Math.min(width.value-boxWidth-8,px+12));
    const cy=Math.max(top,Math.min(bottom.value-boxHeight,py> (top+bottom.value)/2 ? py-boxHeight-12 : py+12));
    return {...p,px,py,cx,cy,boxHeight,boxWidth};
  });
});
function select(event) {
  const box=event.currentTarget.getBoundingClientRect();
  emit('select',Math.max(props.start,Math.min(props.end,Math.round(props.start+((event.clientX-box.left)/box.width*width.value-64)/(width.value-80)*(props.end-props.start)))));
}
</script>
<template>
  <svg ref="svg" :viewBox="`0 0 ${width} ${height}`" :style="{height:height+'px'}" role="group" :tabindex="compact ? 0 : undefined" @keydown.left.prevent="compact && emit('select', Math.max(start, month-1))" @keydown.right.prevent="compact && emit('select', Math.min(end, month+1))" :aria-labelledby="`${id}-title ${id}-desc`" @pointerdown="select" @pointerleave="hovered=null" @keydown.esc="hovered=null">
    <title :id="`${id}-title`">{{ title }}</title><desc :id="`${id}-desc`">{{ description }}</desc>
    <g v-if="compact" class="selection-summary"><text x="8" y="16">{{ date(month) }} · {{ annotations[0].values.map(v => v.label + ' ' + fmt(v.value)).join(' · ') }} JPY</text></g>
    <g v-else class="selection-summary">
      <text class="callout-title" x="8" y="20">{{ zh ? '所选' : 'Selected' }} {{ date(month) }} · {{ zh ? '日元取整' : 'whole JPY' }}</text>
      <text v-for="(v,j) in annotations[0].values" :key="v.label" class="callout-value" x="8" :y="40+j*18">{{ v.label }} {{ amount(v.value) }} {{ zh ? '日元' : 'JPY' }}</text>
    </g>
    <g v-for="tick in ticks" :key="tick"><line x1="64" :x2="width-16" :y1="y(tick)" :y2="y(tick)" stroke="#d8d3c8"/><text x="56" :y="y(tick)+5" text-anchor="end">{{ fmt(tick) }}</text></g>
    <g v-for="p in payoffs" :key="p.label"><line :x1="x(p.month)" :x2="x(p.month)" :y1="top" :y2="bottom" stroke="#aaa497" stroke-dasharray="2 5"/></g>
    <polyline v-for="(s,i) in series" :key="s.label" :points="points(s)" fill="none" :stroke="i ? '#6d681e' : '#b63824'" :stroke-dasharray="i ? '7 5' : undefined" stroke-width="2.5" vector-effect="non-scaling-stroke"/>
    <line v-if="month >= start" :x1="x(month)" :x2="x(month)" :y1="top" :y2="bottom" stroke="#20231f" stroke-dasharray="3 4"/>
    <g v-for="m in axisMonths" :key="m"><text :x="x(m)" :y="height-42" :text-anchor="m===start?'start':m===end?'end':'middle'">{{ axisLabel(m) }}</text></g>
    <text x="64" :y="height-18">{{ compact ? (zh ? '经过年数' : 'Elapsed years') : (zh ? '还款月份' : 'Repayment month') }}</text>
    <g v-for="(p,i) in annotations" :key="i" class="point-marker" :tabindex="p.month >= start ? 0 : -1" role="button" :aria-label="`${p.label} ${date(Math.floor(p.month))}: ${p.values.map(v=>v.label+' '+amount(v.value)).join(', ')} ${zh ? '日元' : 'JPY'}`" @pointerenter="hovered=i" @pointerleave="hovered=null" @focus="hovered=i" @blur="hovered=null" @keydown.enter.prevent="emit('select',Math.max(0,Math.min(end,Math.round(p.month))))" @keydown.space.prevent="emit('select',Math.max(0,Math.min(end,Math.round(p.month))))" @pointerdown.stop="emit('select',Math.max(0,Math.min(end,Math.round(p.month))))">
      <g v-for="v in (p.month >= start ? p.values : [])" :key="v.label">
        <circle :cx="p.px" :cy="y(v.value)" r="14" fill="transparent"/>
        <circle :cx="p.px" :cy="y(v.value)" :r="p.special ? 5 : 3" fill="#f7f4ed" stroke="#b63824" stroke-width="2"/>
      </g>
      <g v-if="hovered === i" class="point-callout">
        <rect :x="p.cx" :y="p.cy" :width="p.boxWidth" :height="p.boxHeight" rx="3" fill="#fffcf6" stroke="#aaa497"/>
        <text class="callout-title" :x="p.cx+7" :y="p.cy+17">{{ p.label }} · {{ date(Math.floor(p.month)) }}</text>
        <text v-for="(v,j) in p.values" :key="v.label" class="callout-value" :x="p.cx+7" :y="p.cy+35+j*18">{{ v.label }} {{ amount(v.value) }} {{ zh ? '日元' : 'JPY' }}</text>
      </g>
    </g>
  </svg>
</template>
<style scoped>
svg{display:block;width:100%;cursor:crosshair;overflow:visible}text{font:12px system-ui;fill:#55584e}.point-marker:focus-visible{outline:none}.point-marker:focus-visible circle:last-child{stroke:#20231f;stroke-width:3}.callout-title{font-weight:600;fill:#20231f}.callout-value{font-size:12px;font-variant-numeric:tabular-nums}
</style>

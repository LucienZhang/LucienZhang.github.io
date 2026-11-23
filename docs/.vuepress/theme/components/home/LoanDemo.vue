<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import { useRoute } from 'vue-router';
import { defaults, validate, calculate } from '../../../lib/loan/loan.mjs';
import { mortgageHref } from '../../../lib/loan/handoff.mjs';
import { aiExplanationEnabled } from '../../../../../services/ai-interpreter/client/site-config.mjs';
import { getBrowserClient } from '../../../../../services/ai-interpreter/client/browser.mjs';
import MortgageChart from '../../../components/tools/mortgage/MortgageChart.vue';
import { crossings } from '../../../components/tools/mortgage/model.mjs';
import AiExplanationPanel from '../AiExplanationPanel.vue';
import LinkArrow from '../LinkArrow.vue';
const props = defineProps({ zh: Boolean });
const route = useRoute();
const t = (en, cn) => props.zh ? cn : en;
const ready = ref(false);
const draft = ref({ ...defaults });
const result = ref(calculate(defaults));
const errors = computed(() => validate(draft.value));
const invalid = computed(() => Object.values(errors.value).some(Boolean));
const locale = computed(() => props.zh ? 'zh-CN' : 'en-US');
const money = n => new Intl.NumberFormat(locale.value, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const compactMoney = n => new Intl.NumberFormat(locale.value, { notation: 'compact', maximumFractionDigits: 2 }).format(Number(n.toFixed(2)));
const methods = computed(() => [
  { key: 'payment', label: t('Equal payment', '元利均等（等额本息）'), short: t('Equal payment', '等额本息') },
  { key: 'principal', label: t('Equal principal', '元金均等（等额本金）'), short: t('Equal principal', '等额本金') },
]);
const metrics = computed(() => [['first', t('First month', '首月月供')], ['interest', t('Total interest', '总利息')]]);
const selectedMonth = ref(1);
const toolHref = computed(() => mortgageHref(result.value.input, props.zh));
const series = computed(() => methods.value.map((method, i) => ({ label: `${i ? 'B' : 'A'} · ${method.label}`, points: result.value[method.key].rows.map(row => ({ month: row.month, value: row.payment })) })));
const flips = computed(() => crossings(result.value.payment.rows.map((row, i) => ({ month: row.month, value: row.payment - result.value.principal.rows[i].payment }))));
const markers = computed(() => flips.value.flips.map(f => ({ month: f.month, value: result.value.payment.rows[Math.floor(f.month) - 1].payment })));
const chartDescription = computed(() => t('A: equal payment. B: equal principal. Crossings compare monthly payments, not overall cost. Use left/right arrows to inspect months.', 'A：元利均等。B：元金均等。交点仅比较月供，不代表整体成本优劣。左右方向键可查看各期。'));
const saving = computed(() => result.value.payment.interest - result.value.principal.interest);
const aiEnabled = ref(false);
const trigger = ref(null), aiPanel = ref(null), explanationOpen = ref(false);
const aiClient = shallowRef(null);
function cancel() { aiPanel.value?.invalidate(); }
watch(draft, () => {
  cancel();
  if (!invalid.value) {
    result.value = calculate(draft.value);
    selectedMonth.value = Math.min(selectedMonth.value, result.value.months);
  }
}, { deep: true, flush: 'sync' });
function reset() { draft.value = { ...defaults }; selectedMonth.value = 1; }
async function openExplanation() { explanationOpen.value = true; await nextTick(); aiPanel.value?.focus(); }
async function closeExplanation() { cancel(); explanationOpen.value = false; await nextTick(); trigger.value?.focus(); }
watch(() => props.zh, () => { cancel(); reset(); explanationOpen.value = false; });
onMounted(async () => {
  ready.value = true;
  aiEnabled.value = aiExplanationEnabled();
  if (!aiEnabled.value) return;
  try { aiClient.value = getBrowserClient(); } catch { /* Unsupported preview origins keep the calculator usable. */ }
  if (route.query.ai === 'return' && aiClient.value) {
    const input = aiClient.value.takeReturn().input;
    if (input) {
      const restored = { amount: input.amount, rate: input.annualRatePct, years: input.months / 12 };
      if (!Object.values(validate(restored)).some(Boolean)) draft.value = restored;
    }
    document.getElementById('lab')?.scrollIntoView({ block: 'start', behavior: 'instant' });
    await openExplanation();
  }
});
onBeforeUnmount(cancel);
</script>

<template>
  <article id="playground" class="loan-demo" aria-labelledby="loan-title">
    <p class="kicker">{{ t('Interactive · Loan comparison', '交互作品 · 房贷比较') }}</p>
    <h3 id="loan-title">{{ t('One loan, two ways to repay.', '同一笔贷款，两种还款方式') }}</h3>
    <p class="assumptions">{{ compactMoney(result.input.amount) }} {{ t('JPY', '日元') }} · {{ result.input.rate }}% {{ t('fixed / year', '固定年利率') }} · {{ result.input.years }} {{ t('years', '年') }} · {{ t('no fees or taxes', '不含税费') }}</p>
    <p v-if="!ready" class="notice">{{ t('JavaScript is off. The default chart and results remain readable; controls are disabled.', 'JavaScript 已关闭，默认图表和结果仍可阅读，交互控件已禁用。') }}</p>
    <p v-if="invalid" class="notice error" role="status">{{ t('Inputs are invalid. Showing the last valid result.', '输入无效，当前保留最后有效结果。') }}</p>
    <figure class="chart">
      <div class="chart-heading"><figcaption>{{ t('Monthly · JPY', '月供 · JPY') }}</figcaption><div class="legend"><span class="payment">A · {{ methods[0].short }}</span><span class="principal">B · {{ methods[1].short }}</span></div></div>
      <MortgageChart id="home-loan-chart" :title="t('Monthly payment comparison', '月供比较')" :description="chartDescription" :series="series" :month="selectedMonth" :start="1" :end="result.months" :markers="markers" :payoffs="[]" :zh="zh" compact @select="selectedMonth = $event" />
    </figure>
    <fieldset class="term-controls" :disabled="!ready">
      <label for="loan-years">{{ t('Term', '年限') }}</label>
      <button type="button" :disabled="draft.years <= 1" :aria-label="t('Decrease term by one year', '年限减少一年')" @click="draft.years--">−</button>
      <input id="loan-years" v-model.number="draft.years" type="range" min="1" max="50" step="1" :aria-valuetext="`${draft.years} ${t('years', '年')}`">
      <button type="button" :disabled="draft.years >= 50" :aria-label="t('Increase term by one year', '年限增加一年')" @click="draft.years++">+</button>
      <output for="loan-years">{{ draft.years }} {{ t('years', '年') }}</output>
    </fieldset>
    <details class="parameters"><summary>{{ t('More inputs', '更多参数') }}</summary>
      <fieldset :disabled="!ready" class="input-grid">
        <label for="loan-amount">{{ t('Amount · JPY', '金额 · JPY') }}<input id="loan-amount" v-model.number="draft.amount" type="number" min="1" max="10000000000" step="1" :aria-invalid="errors.amount" aria-describedby="amount-help"><small id="amount-help" :class="{ error: errors.amount }">{{ t('1–10,000,000,000; whole JPY.', '1–100 亿，整数日元。') }}</small></label>
        <label for="loan-rate">{{ t('Annual rate · %', '年利率 · %') }}<input id="loan-rate" v-model.number="draft.rate" type="number" min="0" max="20" step="0.1" :aria-invalid="errors.rate" aria-describedby="rate-help"><small id="rate-help" :class="{ error: errors.rate }">{{ t('0–20, fixed nominal annual rate.', '0–20，固定名义年利率。') }}</small></label>
      </fieldset>
      <button type="button" class="reset" :disabled="!ready" @click="reset">{{ t('Reset', '重置') }}</button>
      <p class="point-readout">{{ t('Month', '月份') }} {{ selectedMonth }}: <span v-for="method in methods" :key="method.key">{{ method.label }} JPY {{ money(result[method.key].rows[selectedMonth - 1].payment) }}. </span></p>
    </details>
    <table class="comparison-summary">
      <caption class="sr-only">{{ t('Repayment comparison. All amounts in JPY.', '还款结果比较，金额单位为日元。') }}</caption>
      <thead><tr><td></td><th v-for="(method, i) in methods" :key="method.key" scope="col" :class="method.key">{{ i ? 'B' : 'A' }} <span>{{ method.short }}</span></th></tr></thead>
      <tbody><tr v-for="[key, label] in metrics" :key="key"><th scope="row">{{ label }}</th><td v-for="method in methods" :key="method.key"><data :value="result[method.key][key]"><span aria-hidden="true">{{ compactMoney(result[method.key][key]) }}</span><span class="sr-only">{{ money(result[method.key][key]) }} JPY</span></data></td></tr></tbody>
    </table>
    <p v-if="saving > 0.005" class="insight">{{ t(`B saves ${compactMoney(saving)} JPY in interest, but starts with a higher payment.`, `B 少付利息 ${compactMoney(saving)} 日元，但前期月供更高。`) }}</p>
    <details class="exact-results"><summary>{{ t('Exact amounts · JPY', '精确金额 · 日元') }}</summary><div class="summary-grid">
      <section v-for="method in methods" :key="method.key" :aria-labelledby="`${method.key}-heading`">
        <h4 :id="`${method.key}-heading`">{{ method.label }}</h4>
        <dl><div v-for="[key, label] in metrics" :id="`${method.key}-${key}`" :key="key" tabindex="-1"><dt>{{ label }}</dt><dd>{{ money(result[method.key][key]) }}</dd></div></dl>
      </section>
    </div></details>
    <div class="actions">
      <a class="primary full-comparison" :href="toolHref">{{ t('Open full comparison', '打开完整房贷比较') }} <LinkArrow /></a>
      <button v-if="aiEnabled" ref="trigger" type="button" class="explain-action" :disabled="!ready" :aria-expanded="explanationOpen" aria-controls="explanation" @click="openExplanation"><span>{{ t('AI explanation', 'AI 解释') }}</span><small>{{ t('Sign-in required', '需登录') }}</small></button>
    </div>
    <p v-if="!aiEnabled" class="ai-status"><span class="pending-dot" aria-hidden="true"></span>{{ t('AI explanation: backend deployed, model access pending.', 'AI 解释：后端已部署，模型权限开通中。') }} <a href="#ai-service">{{ t('See how it works', '看看它怎么工作') }}</a></p>
    <AiExplanationPanel v-if="aiEnabled && explanationOpen" ref="aiPanel" :input="{ currency: 'JPY', amount: draft.amount, annualRatePct: draft.rate, months: draft.years * 12 }" :invalid="invalid" :locale="locale" :client="aiClient" @close="closeExplanation" />
  </article>
</template>

<style scoped>
.loan-demo { display: flex; flex-direction: column; height: 100%; padding: 28px; border-radius: 16px; background: #fffdf8; border: 1px solid #ddd7cc; box-shadow: 0 1px 0 rgb(32 35 31 / 4%), 0 24px 48px -32px rgb(32 35 31 / 25%); scroll-margin-top: calc(var(--navbar-height) + 24px); min-width: 0; }
.kicker { margin: 0 0 10px; font: 600 12px/16px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; letter-spacing: .08em; text-transform: uppercase; color: #b63824; }
h3 { margin: 0; font-size: 22px !important; line-height: 30px !important; }
.assumptions { margin: 6px 0 0; font-size: 13px; line-height: 20px; color: #64665f; font-variant-numeric: tabular-nums; }
.chart { position: relative; margin: 12px 0 0; }
.chart-heading, .legend { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 14px; font-size: 13px; line-height: 18px; }
.chart-heading { justify-content: space-between; }
.legend span { white-space: nowrap; }
.legend span::before { content: ''; width: 16px; display: inline-block; border-top: 2px solid #b63824; vertical-align: middle; margin-right: 4px; }
.legend .principal::before { border-color: #6d681e; border-top-style: dashed; }
.term-controls { display: grid; grid-template-columns: auto 44px minmax(0, 1fr) 44px auto; gap: 8px; align-items: center; margin: 4px 0 0; padding: 0; border: 0; min-width: 0; }
.term-controls button { padding: 0; font-size: 22px; }
.term-controls input { padding: 0; accent-color: #b63824; min-width: 0; border: 0; }
.term-controls output { min-width: 56px; font-variant-numeric: tabular-nums; white-space: nowrap; }
.input-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; border: 0; padding: 0; margin: 0; min-width: 0; }
.input-grid label { display: grid; gap: 4px; }
.parameters[open] { padding-bottom: 12px; }
.reset { margin-top: 8px; }
.point-readout { font-size: 13px; line-height: 20px; }
.comparison-summary { display: table; width: 100%; margin: 4px 0 0; table-layout: fixed; border-collapse: collapse; font-size: 13px; line-height: 20px; }
.comparison-summary th, .comparison-summary td { border: 0; border-bottom: 1px solid #ddd7cc; padding: 6px 4px; text-align: right; background: transparent; }
.comparison-summary tr { background: transparent; border: 0; }
.comparison-summary th:first-child, .comparison-summary td:first-child { width: 28%; text-align: left; padding-left: 0; }
.comparison-summary thead th { font-weight: 500; }
.comparison-summary thead th.payment { color: #b63824; }
.comparison-summary thead th.principal { color: #6d681e; }
.comparison-summary tbody th { font-weight: 400; color: #64665f; }
.comparison-summary data { font-size: 18px; line-height: 26px; font-weight: 650; font-variant-numeric: tabular-nums; white-space: nowrap; }
.insight { margin: 10px 0 0; padding: 8px 12px; border-radius: 8px; background: #f3ece0; font-size: 13px; line-height: 20px; }
.exact-results > summary { color: #64665f; }
.summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.summary-grid h4 { margin: 0 0 6px; font-size: 14px; line-height: 20px; }
.summary-grid dl { margin: 0; }
.summary-grid dl div { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 4px 8px; padding: 4px 0; font-size: 13px; line-height: 20px; }
.summary-grid dd { margin: 0; font-variant-numeric: tabular-nums; font-weight: 500; }
.summary-grid dt { color: #64665f; }
.exact-results[open] { padding-bottom: 12px; }
.actions { display: flex; gap: 10px; align-items: stretch; margin-top: auto; padding-top: 12px; }
.primary { display: inline-flex; flex: 1; align-items: center; justify-content: center; gap: 10px; min-height: 48px; padding: 8px 16px; border-radius: 10px; background: #b63824; color: #fff !important; font-weight: 600; }
.primary:hover { background: #962c1b; text-decoration: none !important; }
.explain-action { display: inline-flex; flex-direction: column; align-items: center; justify-content: center; gap: 0; padding: 4px 14px !important; border-radius: 10px !important; }
.explain-action small { font-size: 11px; line-height: 14px; }
.ai-status { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; margin: 10px 0 0; font-size: 12px; line-height: 18px; color: #64665f; }
.ai-status a { padding: 4px 0; }
.pending-dot { width: 8px; height: 8px; border-radius: 50%; background: #d9a441; box-shadow: 0 0 0 3px rgb(217 164 65 / 22%); }
.notice { padding: 10px 12px; background: #e9e1c7; color: #514318; font-size: 13px; }
.error { color: #90231e !important; }
.notice.error { background: #f6e2db; }
@media (max-width: 767px) {
  .loan-demo { padding: 20px; }
  .input-grid { grid-template-columns: 1fr; }
}
@media (max-width: 389px) {
  .loan-demo { padding: 16px; }
  .summary-grid { grid-template-columns: 1fr; }
  .term-controls { gap: 4px; }
  .comparison-summary thead th span { display: block; }
  .comparison-summary data { font-size: 16px; }
}
@media (prefers-reduced-motion: reduce) { .primary { transition: none; } }
</style>

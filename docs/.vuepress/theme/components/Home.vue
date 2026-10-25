<script setup>
import { computed, ref, shallowRef, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { usePageData, useRouteLocale } from 'vuepress/client';
import { defaults, validate, calculate } from '../../lib/loan/loan.mjs';
import SiteLayout from './SiteLayout.vue';
import AiExplanationPanel from './AiExplanationPanel.vue';
import LinkArrow from './LinkArrow.vue';
import { getBrowserClient } from '../../../../services/ai-interpreter/client/browser.mjs';
import { useRoute } from 'vue-router';
import MortgageChart from '../../components/tools/mortgage/MortgageChart.vue';
import { crossings } from '../../components/tools/mortgage/model.mjs';
import { mortgageHref } from '../../lib/loan/handoff.mjs';
const page = usePageData();
const route = useRoute();
const locale = useRouteLocale();
const zh = computed(() => locale.value === '/zh/');
const t = (en, cn) => zh.value ? cn : en;
const ready = ref(false);
const draft = ref({ ...defaults });
const result = ref(calculate(defaults));
const errors = computed(() => validate(draft.value));
const invalid = computed(() => Object.values(errors.value).some(Boolean));
const money = (n) => new Intl.NumberFormat(zh.value ? 'zh-CN' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const compactMoney = (n) => new Intl.NumberFormat(zh.value ? 'zh-CN' : 'en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(Number(n.toFixed(2)));
const methods = computed(() => [
  { key: 'payment', label: t('Equal payment', '元利均等（等额本息）'), short: t('Equal payment', '等额本息') },
  { key: 'principal', label: t('Equal principal', '元金均等（等额本金）'), short: t('Equal principal', '等额本金') },
]);
const metrics = computed(() => [['first', t('First month', '首月月供')], ['interest', t('Total interest', '总利息')]]);
const selectedMonth = ref(1);
const other = computed(() => zh.value ? '/' : '/zh/');
const toolHref = computed(() => mortgageHref(result.value.input, zh.value));
const series = computed(() => methods.value.map((method, i) => ({label: `${i ? 'B' : 'A'} · ${method.label}`, points: result.value[method.key].rows.map(row => ({month: row.month, value: row.payment}))})));
const flips = computed(() => crossings(result.value.payment.rows.map((row, i) => ({month: row.month, value: row.payment-result.value.principal.rows[i].payment}))));
const markers = computed(() => flips.value.flips.map(f => ({month: f.month, value: result.value.payment.rows[Math.floor(f.month)-1].payment})));
const chartDescription = computed(() => t('A: equal payment. B: equal principal. Crossings compare monthly payments, not overall cost. Use left/right arrows to inspect months.', 'A：元利均等。B：元金均等。交点仅比较月供，不代表整体成本优劣。左右方向键可查看各期。'));
const term = ref(null);
const trigger = ref(null);
const explanationOpen = ref(false);
const aiPanel = ref(null);
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
function focusTerm() { term.value?.focus(); term.value?.scrollIntoView({ block: 'center', behavior: 'instant' }); }
async function openExplanation() { explanationOpen.value = true; await nextTick(); aiPanel.value?.focus(); }
async function closeExplanation() { cancel(); explanationOpen.value = false; await nextTick(); trigger.value?.focus(); }
watch(locale, () => { cancel(); reset(); explanationOpen.value = false; });
onMounted(async () => {
  ready.value = true;
  try { aiClient.value = getBrowserClient(); } catch { /* Unsupported preview origins keep the calculator usable. */ }
  if (route.query.ai === 'return' && aiClient.value) {
    const saved = aiClient.value.takeReturn();
    const input = saved.input;
    if (input) {
      const restored = { amount: input.amount, rate: input.annualRatePct, years: input.months / 12 };
      if (!Object.values(validate(restored)).some(Boolean)) draft.value = restored;
    }
    await openExplanation();
  }
});
onBeforeUnmount(cancel);
</script>

<template>
  <SiteLayout><template #page>
  <div id="homepage-top" class="homepage" :class="{ chinese: zh }" data-homepage="production">
    <div class="page-wrap">
      <a class="skip" href="#playground">{{ t('Skip to loan comparison', '跳到贷款比较') }}</a>
      <main aria-labelledby="homepage-title">
        <section class="hero">
          <div class="identity">
            <p class="role">{{ t('AI applications · Data · Backend engineering', 'AI 应用 · 数据 · 后端工程') }}</p>
            <h1 id="homepage-title"><span>{{ t('Turning data & AI', '把数据与 AI，') }}</span><span>{{ t('into useful tools.', '做成可用的工具。') }}</span></h1>
            <p class="intro"><span class="intro-desktop">{{ t('Tools and experiments, starting with a loan comparison you can explore.', '这里是我的工具与实验。从一个可操作的房贷比较开始。') }}</span><span class="intro-mobile">{{ t('Tools and experiments you can explore.', '工具与实验，从可操作的例子开始。') }}</span></p>
            <button class="text-action try-term" :disabled="!ready" @click="focusTerm">{{ t('Change the term. See the payment change.', '调整年限，看看月供变化') }} <LinkArrow /></button>
            <ul class="proof"><li>{{ t('Calculate without signing in', '无需登录即可计算') }}</li><li>{{ t('Inputs, chart and results stay in sync', '参数、图表与结果实时联动') }}</li></ul>
          </div>
          <div id="playground" class="playground">
            <p class="eyebrow">{{ t('Interactive work · Loan comparison', '交互作品 · 房贷比较') }}</p>
            <div class="section-heading"><h2>{{ t('One loan, two ways to repay.', '同一笔贷款，两种还款方式') }}</h2></div>
            <p class="assumptions">{{ compactMoney(result.input.amount) }} {{ t('JPY', '日元') }} · {{ result.input.rate }}% {{ t('fixed / year', '固定年利率') }} · {{ result.input.years }} {{ t('years', '年') }}</p>
            <p class="scope-note">{{ t('Illustrative monthly repayments. No taxes, fees or insurance.', '按月还款，不含税费及保险。仅为示例假设。') }}</p>
            <p v-if="!ready" class="notice">{{ t('JavaScript is off. The default chart and results below remain readable; interactive controls are disabled.', 'JavaScript 已关闭，以下默认图表和结果仍可阅读，交互控件已禁用。') }}</p>
            <p v-if="invalid" class="notice error" role="status">{{ t('Inputs are invalid. Showing the last valid result; explanation is paused.', '输入无效，当前保留最后有效结果，解释已暂停。') }}</p>
            <figure class="chart">
              <div class="chart-heading"><figcaption>{{ t('Monthly · JPY', '月供 · JPY') }}</figcaption><div class="legend"><span class="payment">A · {{ methods[0].short }}</span><span class="principal">B · {{ methods[1].short }}</span></div></div>
              <MortgageChart id="home-loan-chart" :title="t('Monthly payment comparison', '月供比较')" :description="chartDescription" :series="series" :month="selectedMonth" :start="1" :end="result.months" :markers="markers" :payoffs="[]" :zh="zh" compact @select="selectedMonth = $event" />
            </figure>
            <fieldset class="term-controls" :disabled="!ready">
              <label for="loan-years">{{ t('Term', '年限') }}</label>
              <button :disabled="draft.years <= 1" :aria-label="t('Decrease term by one year', '年限减少一年')" @click="draft.years--">−</button>
              <input id="loan-years" ref="term" v-model.number="draft.years" type="range" min="1" max="50" step="1" :aria-valuetext="`${draft.years} ${t('years', '年')}`">
              <button :disabled="draft.years >= 50" :aria-label="t('Increase term by one year', '年限增加一年')" @click="draft.years++">+</button>
              <output for="loan-years">{{ draft.years }} {{ t('years', '年') }}</output>
            </fieldset>
            <details class="parameters"><summary>{{ t('More inputs', '更多参数') }}</summary>
              <fieldset :disabled="!ready" class="input-grid">
                <label for="loan-amount">{{ t('Amount · JPY', '金额 · JPY') }}<input id="loan-amount" v-model.number="draft.amount" type="number" min="1" max="10000000000" step="1" :aria-invalid="errors.amount" aria-describedby="amount-help"><small id="amount-help" :class="{ error: errors.amount }">{{ t('1–10,000,000,000; whole JPY.', '1–100 亿，整数日元。') }}</small></label>
                <label for="loan-rate">{{ t('Annual rate · %', '年利率 · %') }}<input id="loan-rate" v-model.number="draft.rate" type="number" min="0" max="20" step="0.1" :aria-invalid="errors.rate" aria-describedby="rate-help"><small id="rate-help" :class="{ error: errors.rate }">{{ t('0–20, fixed nominal annual rate.', '0–20，固定名义年利率。') }}</small></label>
              </fieldset>
              <button :disabled="!ready" @click="reset">{{ t('Reset', '重置') }}</button>
              <p class="point-readout">{{ t('Month', '月份') }} {{ selectedMonth }}: <span v-for="method in methods" :key="method.key">{{ method.label }} JPY {{ money(result[method.key].rows[selectedMonth - 1].payment) }}. </span></p>
            </details>
            <div class="results">
              <table class="comparison-summary">
                <caption class="sr-only">{{ t('Repayment comparison. All amounts in JPY.', '还款结果比较，金额单位为日元。') }}</caption>
                <thead><tr><td></td><th v-for="(method, i) in methods" :key="method.key" scope="col" :class="method.key">{{ i ? 'B' : 'A' }} <span>{{ method.short }}</span></th></tr></thead>
                <tbody><tr v-for="[key, label] in metrics" :key="key"><th scope="row">{{ label }}</th><td v-for="method in methods" :key="method.key"><data :value="result[method.key][key]"><span aria-hidden="true">{{ compactMoney(result[method.key][key]) }}</span><span class="sr-only">{{ money(result[method.key][key]) }} JPY</span></data></td></tr></tbody>
              </table>
              <details class="exact-results"><summary>{{ t('Exact amounts · JPY', '精确金额 · 日元') }}</summary><div class="summary-grid">
                <section v-for="method in methods" :key="method.key" :aria-labelledby="`${method.key}-heading`">
                  <h3 :id="`${method.key}-heading`">{{ method.label }}</h3>
                  <dl><div v-for="[key, label] in metrics" :id="`${method.key}-${key}`" :key="key" tabindex="-1"><dt>{{ label }}</dt><dd>{{ money(result[method.key][key]) }}</dd></div></dl>
                </section>
              </div>
              <p class="fine">{{ t('All amounts in JPY, rounded to 2 decimals for display.', '金额均为 JPY，展示保留两位小数。') }}</p>
              </details>
            </div>
            <div class="actions"><a class="primary full-comparison" :href="toolHref">{{ t('Open full comparison', '打开完整房贷比较') }} <LinkArrow /></a><button ref="trigger" class="explain-action" :disabled="!ready" :aria-expanded="explanationOpen" aria-controls="explanation" @click="openExplanation"><span>{{ t('AI explanation', 'AI 解释') }}</span><small>{{ t('Sign-in required', '需登录') }}</small></button></div>
            <p class="access-note">{{ t('No sign-in for calculations. AI explanations are optional.', '计算无需登录；AI 解释按需使用。') }}</p>
            <AiExplanationPanel v-if="explanationOpen" ref="aiPanel" :input="{ currency: 'JPY', amount: draft.amount, annualRatePct: draft.rate, months: draft.years * 12 }" :invalid="invalid" :locale="zh ? 'zh-CN' : 'en-US'" :client="aiClient" @close="closeExplanation" />
          </div>
        </section>
        <section id="tools" class="page-section"><h2>{{ t('Tools', '工具') }}</h2><div class="tools-grid">
          <article><h3>{{ t('Loan comparison', '贷款比较') }}</h3><p>{{ t('Compare fixed-rate repayment methods and explore how parameters affect outcomes.', '比较固定利率还款方式，探索参数如何影响结果。') }}</p><a class="text-action" :href="toolHref">{{ t('Explore the tool', '进入工具页') }} <LinkArrow /></a></article>
          <article><h3>{{ t('Japan tax calculator', '日本税务计算器') }}</h3><p>{{ t('2025 salary income / 2026 resident tax estimates. Enter confirmed deductions; limited scenarios only.', '2025 工资收入／2026 住民税概算。扣除额需自行确认，仅适用限定场景。') }}</p><a class="text-action" :href="zh ? '/zh/tools/japan-tax.html' : '/tools/japan-tax.html'">{{ t('Open the tax calculator', '打开税务计算器') }} <LinkArrow /></a></article>
          <article><h3>{{ t('AI stock screener', 'AI 筛股器') }}</h3><span class="badge planned">{{ t('Planned', '规划中') }}</span><p>{{ t('Planned: turn natural language into explicit filters. Screening and AI are not connected.', '计划将自然语言转为明确筛选条件；尚未接入筛选或 AI。') }}</p></article>
        </div></section>
        <section id="engineering" class="page-section"><h2>{{ t('Engineering', '工程') }}</h2><div class="engineering-grid"><div><h3 class="section-statement">{{ t('Behind the interface.', '界面背后的工程。') }}</h3><p>{{ t('Experience with data platforms for machine learning and configuration-driven engineering.', '为机器学习构建数据平台，让重复的数据流程成为可复用的系统。') }}</p></div><div class="experience"><article><span class="engineering-symbol" aria-hidden="true">⠿</span><div><h3>{{ t('Data for machine learning', '机器学习数据平台') }}</h3><p>{{ t('Worked on profile data pipelines and data integration supporting recommendation systems.', '曾参与支持推荐系统的个人资料数据管道与数据整合。') }}</p></div></article><article><span class="engineering-symbol" aria-hidden="true">⚙</span><div><h3>{{ t('Configuration-driven platforms', '配置驱动的工程') }}</h3><p>{{ t('Worked on data lake pipelines and reusable workflows driven by SQL and YAML.', '曾参与数据湖管道与 SQL、YAML 配置驱动的可复用数据流程。') }}</p></div></article></div></div>
          <details class="how"><summary>{{ t('How this preview works', '贷款预览如何实现') }}</summary><p>{{ t('Inputs are validated before deterministic calculations run. The chart and summary share the same result; explore monthly tables in the full tool. After sign-in, AI explains the current inputs and backend calculation summaries. It does not change the calculator results.', '输入通过校验后运行确定性计算。图表与摘要共用同一结果，完整月度表格可进入工具页探索。登录后，AI 根据当前参数和后端计算摘要生成解释，不改变计算器结果。') }}</p><p><a href="https://v.icbc.com.cn/userfiles/resources/wap/fenhang/shanghai/fengxian/txt/jrkj231120.pdf">{{ t('Repayment formulas · ICBC', '还款公式依据 · 工商银行') }} <LinkArrow external /></a></p></details>
          <div class="flow" :aria-label="t('Calculation flow', '计算流程')"><span>{{ t('Inputs', '输入') }}</span><LinkArrow /><span>{{ t('Calculation', '计算') }}</span><LinkArrow /><span>{{ t('Chart + table', '图表与数据') }}</span><LinkArrow /><span>{{ t('AI explanation', 'AI 解释') }} <small>{{ t('(sign-in required)', '（需登录）') }}</small></span></div>
          <div class="links"><a href="https://github.com/LucienZhang/goto">Goto · Go CLI <LinkArrow external /></a><a href="https://github.com/vuepress/vuepress-next/pull/460">{{ t('VuePress · contribution', 'VuePress · 开源贡献') }} <LinkArrow external /></a></div>
        </section>
        <section id="notes" class="page-section"><h2>{{ t('Notes', '笔记') }}</h2><a class="note-row" href="/programming/algorithms/overview.html"><span>{{ t('Algorithms', '算法笔记') }}</span><small v-if="zh" class="badge planned">英文内容</small><LinkArrow /></a><a class="note-row" href="/misc/apis.html"><span>{{ t('Web API Design', 'Web API 设计') }}</span><small v-if="zh" class="badge planned">英文内容</small><LinkArrow /></a><a class="note-row" :href="zh ? '/zh/ml/mnist.html' : '/ml/mnist.html'"><span>{{ t('Handwritten Digit Recognition', '手写数字识别') }}</span><LinkArrow /></a></section>
        <section id="contact" class="page-section contact"><h2>{{ t('Contact', '联系') }}</h2><h3 class="section-statement">{{ t('Let’s build something useful.', '一起做些有用的东西。') }}</h3><a class="email" href="mailto:lucienzhangzl@gmail.com">lucienzhangzl@gmail.com <LinkArrow external /></a><div class="links"><a href="https://github.com/LucienZhang">GitHub <LinkArrow external /></a><a href="https://www.linkedin.com/in/zhang-ziliang/">LinkedIn <LinkArrow external /></a></div></section>
      </main>
      <footer><span>© {{ page.frontmatter.copyrightYear }} Ziliang Zhang</span><a :href="other">{{ t('中文', 'EN') }}</a></footer>
    </div>
  </div>
  </template></SiteLayout>
</template>

<style scoped>
.homepage {
  --paper: var(--vp-c-bg, #f7f4ed);
  --ink: var(--vp-c-text, #20231f);
  --accent: #b63824;
  --muted: #64665f;
  --line: #cbc7bd;
  background: var(--paper);
  color: var(--ink);
  color-scheme: light;
  min-height: 100vh;
  font: 16px/1.5 system-ui, sans-serif;
}
.homepage *, .homepage *::before, .homepage *::after { box-sizing: border-box; }
.page-wrap { max-width: 1360px; padding: 0 40px; margin: auto; }
.homepage h1, .homepage h2, .homepage h3, .homepage p, .homepage figure, .homepage dl { margin: 0; }
.homepage h1, .homepage h2, .homepage h3 { color: var(--ink); border: 0; padding: 0; font-weight: 600; text-wrap: balance; }
.homepage h2 { font-size: 24px; line-height: 32px; }
.homepage h3 { font-size: 20px; line-height: 28px; }
.homepage p { margin-top: 12px; text-wrap: pretty; }
.homepage a { color: var(--accent); text-decoration: none; font-weight: 500; }
.homepage a:hover { text-decoration: underline; }
.homepage button, .homepage input, .homepage select { font: inherit; color: var(--ink); background: transparent; border: 1px solid #797b72; border-radius: 4px; min-height: 44px; }
.homepage button { padding: 8px 12px; cursor: pointer; }
.homepage button:hover:not(:disabled) { background: #eee7db; }
.homepage button:active:not(:disabled) { background: #e2d8c9; }
.homepage button:disabled, .homepage fieldset:disabled { opacity: .55; cursor: default; }
.homepage input, .homepage select { padding: 8px; max-width: 100%; width: 100%; }
.homepage :focus-visible { outline: 2px solid var(--accent); outline-offset: 4px; }
.homepage [tabindex='-1']:focus { outline: 2px solid var(--accent); outline-offset: 4px; }
.homepage fieldset { min-width: 0; border: 0; padding: 0; margin: 0; }
.homepage summary { min-height: 44px; padding: 12px 0; cursor: pointer; font-size: 14px; line-height: 20px; }
.homepage small, .fine { font-size: 14px; line-height: 20px; color: var(--muted); }
.homepage details { margin: 0; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.skip { position: absolute; top: -100px; padding: 12px; background: var(--paper); z-index: 40; }
.skip:focus { top: 8px; }

.hero { display: grid; grid-template-columns: 2fr 3fr; gap: 40px; padding: 32px 0 40px; }
.identity { display: flex; flex-direction: column; align-items: start; padding: 24px 0; min-width: 0; }
.homepage .role { font-size: 14px; line-height: 20px; color: var(--muted); margin: 0 0 32px; }
.homepage h1 { width: 100%; font-size: 48px; line-height: 1.2; letter-spacing: -.025em; max-width: 680px; }
.homepage h1 span { display: block; }
.intro { margin-top: 24px !important; max-width: 34ch; }
.intro-mobile { display: none; }
.homepage .text-action { display: inline-flex; align-items: center; gap: 8px; border: 0; color: var(--accent); padding: 8px 0; text-align: left; }
.identity .text-action { margin-top: 24px; }
.proof { display: grid; gap: 12px; margin: auto 0 0; padding: 32px 0 0; list-style: none; font-size: 14px; line-height: 20px; }
.proof::before { content: ''; width: 64px; border-top: 1px solid var(--line); margin-bottom: 4px; }
.playground { min-width: 0; border-left: 1px solid var(--line); padding-left: 32px; scroll-margin-top: calc(var(--navbar-height) + 24px); }
.homepage .eyebrow { margin: 0 0 8px; font-size: 14px; line-height: 20px; color: var(--accent); font-weight: 500; }
.assumptions { margin-top: 8px !important; font-size: 14px; line-height: 20px; color: var(--muted); font-variant-numeric: tabular-nums; }
.scope-note { margin-top: 4px !important; font-size: 14px; line-height: 20px; color: var(--muted); }
.chart { position: relative; margin-top: 8px !important; }
.chart-heading, .legend { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 16px; font-size: 14px; line-height: 20px; }
.chart-heading { justify-content: space-between; }
.legend { gap: 8px 12px; }
.legend span { white-space: nowrap; }
.legend span::before { content: ''; width: 16px; display: inline-block; border-top: 2px solid var(--accent); vertical-align: middle; margin-right: 4px; }
.legend .principal::before { border-color: #6d681e; border-top-style: dashed; }
.term-controls { display: grid; grid-template-columns: auto 44px minmax(0, 1fr) 44px auto; gap: 12px; align-items: center; margin-top: 8px !important; }
.term-controls button { padding: 0; font-size: 24px; }
.term-controls input { padding: 0; accent-color: var(--ink); min-width: 0; }
.term-controls output { min-width: 64px; font-variant-numeric: tabular-nums; white-space: nowrap; }
.input-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.input-grid label { display: grid; gap: 4px; }
.parameters[open] { padding-bottom: 16px; }
.parameters > button { margin-top: 8px; }
.point-readout { font-size: 14px; line-height: 20px; }
.results { min-width: 0; }
.homepage .comparison-summary { display: table; width: 100%; margin: 0; table-layout: fixed; border-collapse: collapse; font-size: 14px; line-height: 20px; }
.comparison-summary th, .comparison-summary td { border: 0; border-bottom: 1px solid var(--line); padding: 4px; text-align: right; background: transparent; }
.comparison-summary tr { background: transparent; border: 0; }
.comparison-summary th:first-child, .comparison-summary td:first-child { width: 28%; text-align: left; padding-left: 0; }
.comparison-summary thead th { font-weight: 500; }
.comparison-summary thead th.payment { color: var(--accent); }
.comparison-summary thead th.principal { color: #6d681e; }
.comparison-summary tbody th { font-weight: 400; color: var(--muted); }
.comparison-summary data { font-size: 18px; line-height: 28px; font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; }
.exact-results > summary { color: var(--muted); }
.summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.summary-grid section { min-width: 0; }
.summary-grid h3 { font-size: 16px; line-height: 24px; margin-bottom: 8px; }
.summary-grid dl div { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 4px 8px; padding: 4px 0; font-size: 14px; line-height: 20px; }
.summary-grid dd { margin: 0; font-variant-numeric: tabular-nums; font-weight: 500; }
.summary-grid dt { color: var(--muted); }
.exact-results[open] { padding-bottom: 16px; }
.actions { display: flex; gap: 12px; align-items: stretch; }
.homepage .primary { display: inline-flex; align-items: center; justify-content: center; gap: 12px; min-height: 48px; padding: 8px 12px; border: 1px solid var(--accent); border-radius: 4px; background: var(--accent); color: #fff; font-weight: 600; }
.homepage .primary:hover { background: #962c1b; text-decoration: none; }
.homepage .primary:active { background: #802516; }
.homepage .explain-action { display: inline-flex; align-items: center; gap: 8px; }
.homepage .explain-action small { font-size: 12px; line-height: 16px; }
.homepage .access-note { margin-top: 8px; font-size: 12px; line-height: 16px; color: var(--muted); }
.notice { padding: 12px; background: #e9e1c7; color: #514318; }
.error { color: #90231e !important; }
.notice.error { background: #f6e2db; }

.page-section { border-top: 1px solid var(--line); padding: 32px 0 48px; scroll-margin-top: calc(var(--navbar-height) + 16px); }
.page-section > h2 { color: var(--accent); margin-bottom: 24px; }
.tools-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
.tools-grid article { min-width: 0; }
.tools-grid p { max-width: 33ch; }
.badge { display: inline-block; font-size: 14px; line-height: 20px; padding: 4px 8px; border-radius: 4px; }
.badge.planned { background: #eae5d6; color: #605821; }
.tools-grid .badge { margin-top: 12px; }
.engineering-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 64px; }
.homepage .section-statement { font-size: 30px; line-height: 36px; }
.experience article { display: flex; gap: 24px; padding-bottom: 24px; }
.experience article + article { border-top: 1px solid var(--line); padding-top: 24px; }
.engineering-symbol { font-size: 36px; width: 44px; flex-shrink: 0; }
.how { margin-top: 24px !important; }
.flow { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 24px; padding: 16px; border: 1px solid var(--line); }
.links { display: flex; flex-wrap: wrap; gap: 12px 24px; margin-top: 16px; }
.links a { min-height: 44px; padding: 12px 0; }
.note-row { display: flex; gap: 16px; align-items: center; min-height: 56px; padding: 16px 8px; border-bottom: 1px solid var(--line); color: var(--ink) !important; }
.note-row > span:first-child { margin-right: auto; }
.note-row small { flex-shrink: 0; }
.email { display: inline-block; padding: 12px 0; overflow-wrap: anywhere; }
footer { display: flex; justify-content: space-between; gap: 24px; padding: 16px 0; border-top: 1px solid var(--line); font-size: 14px; line-height: 20px; align-items: center; }
footer a { display: flex; min-width: 44px; min-height: 44px; align-items: center; justify-content: center; }

@media (max-width: 1359px) {
  .hero { padding-top: 24px; }
}
@media (max-width: 1279px) {
  .hero { gap: 32px; grid-template-columns: 2fr 3fr; padding-top: 24px; }
  .homepage h1 { font-size: 36px; line-height: 40px; }
  .playground { padding-left: 24px; }
  .term-controls { gap: 8px; }
  .homepage .explain-action { flex-direction: column; justify-content: center; gap: 0; padding: 4px 12px; }
}
@media (max-width: 1023px) {
  .hero { grid-template-columns: 1fr; gap: 24px; }
  .identity { padding: 0; }
  .homepage .role { margin-bottom: 16px; }
  .intro { max-width: 52ch; margin-top: 16px !important; }
  .identity .text-action { margin-top: 8px; }
  .proof { display: none; }
  .playground { border-left: 0; border-top: 1px solid var(--line); padding: 24px 0 0; }
  .engineering-grid { gap: 32px; }
}
@media (max-width: 767px) {
  .page-wrap { padding: 0 24px; }
  .hero { padding: 16px 0 32px; gap: 16px; }
  .homepage .role, .identity .try-term { display: none; }
  .homepage h1 { font-size: 36px; line-height: 40px; }
  .intro { margin-top: 8px !important; }
  .intro-desktop { display: none; }
  .intro-mobile { display: inline; }
  .playground { padding-top: 16px; }
  .homepage .eyebrow { margin-bottom: 4px; }
  .playground h2 { font-size: 20px; line-height: 28px; }
  .assumptions { margin-top: 4px !important; }
  .chart { margin-top: 8px !important; }
  .chart-heading, .legend { gap: 4px 8px; font-size: 12px; line-height: 16px; }
  .term-controls { gap: 8px; font-size: 14px; line-height: 20px; }
  .term-controls output { min-width: 48px; }
  .comparison-summary th, .comparison-summary td { padding: 4px; }
  .comparison-summary data { font-size: 16px; line-height: 24px; }
  .comparison-summary thead th { font-size: 12px; line-height: 16px; }
  .actions { gap: 8px; }
  .homepage .primary { flex: 1; gap: 8px; font-size: 14px; line-height: 20px; }
  .homepage .explain-action { font-size: 14px; line-height: 20px; }
  .page-section { padding: 24px 0 32px; }
  .page-section > h2 { margin-bottom: 24px; }
  .tools-grid, .engineering-grid { grid-template-columns: 1fr; gap: 24px; }
  .tools-grid p { max-width: none; }
  .homepage .section-statement { font-size: 24px; line-height: 32px; }
  .experience article { gap: 16px; }
  .flow { gap: 8px 12px; }
  .input-grid { grid-template-columns: 1fr; }
}
@media (max-width: 389px) {
  .page-wrap { padding: 0 16px; }
  .homepage h1 { font-size: 30px; line-height: 36px; }
  .intro { font-size: 14px; line-height: 20px; }
  .summary-grid { grid-template-columns: 1fr; }
  .term-controls { grid-template-columns: auto 44px minmax(0, 1fr) 44px auto; gap: 4px; }
  .term-controls label { font-size: 12px; }
  .comparison-summary thead th span { display: block; }
  .note-row { flex-wrap: wrap; gap: 8px; }
  .note-row small { font-size: 12px; line-height: 16px; }
}
@media (prefers-reduced-motion: reduce) {
  .homepage *, .homepage *::before, .homepage *::after { scroll-behavior: auto !important; transition: none !important; animation: none !important; }
}
</style>

<style>.site-layout .homepage { padding-top: var(--navbar-height); } .site-layout:has(.homepage) { color-scheme: light; } .site-layout:has(.homepage) .vp-navbar { background: #f7f4ed; }</style>

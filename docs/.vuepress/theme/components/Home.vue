<script setup>
import { computed, ref, shallowRef, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { usePageData, useRouteLocale } from 'vuepress/client';
import { defaults, validate, calculate } from '../../lib/loan/loan.mjs';
import SiteLayout from './SiteLayout.vue';
import AiExplanationPanel from './AiExplanationPanel.vue';
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
const methods = computed(() => [{ key: 'payment', label: t('Equal payment', '元利均等（等额本息）') }, { key: 'principal', label: t('Equal principal', '元金均等（等额本金）') }]);
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
            <h1 id="homepage-title">{{ t('Making data explorable and AI useful.', '让数据变得可探索，让 AI 变得有用。') }}</h1>
            <p class="intro">{{ t('AI applications, data, and backend engineering. Explore my tools and experiments.', '我关注 AI 应用、数据与后端工程。这里是我的工具与实验。') }}</p>
            <button class="text-action" :disabled="!ready" @click="focusTerm">{{ t('Try changing a parameter', '试着调整一下') }} <span aria-hidden="true">↓</span></button>
            <a class="secondary-link" href="#contact">{{ t('Get in touch', '联系我') }} <span aria-hidden="true">↗</span></a>
          </div>
          <div id="playground" class="playground">
            <div class="section-heading"><h2>{{ t('Loan comparison', '贷款比较') }}</h2></div>
            <p class="assumptions">JPY {{ money(result.input.amount) }} · {{ result.input.rate }}% {{ t('fixed / year', '固定年利率') }} · {{ result.input.years }} {{ t('years', '年') }}<br>{{ t('Monthly payments. No taxes, fees or insurance. Illustrative assumptions.', '按月还款，不含税费及保险。仅为示例假设。') }}</p>
            <p v-if="!ready" class="notice">{{ t('JavaScript is off. The default chart and results below remain readable; interactive controls are disabled.', 'JavaScript 已关闭，以下默认图表和结果仍可阅读，交互控件已禁用。') }}</p>
            <p v-if="invalid" class="notice error" role="status">{{ t('Inputs are invalid. Showing the last valid result; explanation is paused.', '输入无效，当前保留最后有效结果，解释已暂停。') }}</p>
            <figure class="chart">
              <figcaption>{{ t('Monthly payment · JPY', '月供 · JPY') }}</figcaption>
              <div class="legend"><span class="payment">A · {{ methods[0].label }}</span><span class="principal">B · {{ methods[1].label }}</span></div>
              <MortgageChart id="home-loan-chart" :title="t('Monthly payment comparison', '月供比较')" :description="chartDescription" :series="series" :month="selectedMonth" :start="1" :end="result.months" :markers="markers" :payoffs="[]" :zh="zh" compact @select="selectedMonth = $event" />
            </figure>
            <fieldset class="term-controls" :disabled="!ready">
              <label for="loan-years">{{ t('Term', '年限') }}</label>
              <button :disabled="draft.years <= 1" :aria-label="t('Decrease term by one year', '年限减少一年')" @click="draft.years--">−</button>
              <input id="loan-years" ref="term" v-model.number="draft.years" type="range" min="1" max="50" step="1" :aria-valuetext="`${draft.years} ${t('years', '年')}`">
              <button :disabled="draft.years >= 50" :aria-label="t('Increase term by one year', '年限增加一年')" @click="draft.years++">+</button>
              <output for="loan-years">{{ draft.years }} {{ t('years', '年') }}</output>
            </fieldset>
            <div class="actions"><a class="primary full-comparison" :href="toolHref">{{ t('Open full comparison', '打开完整房贷比较') }} ↗</a><button ref="trigger" class="explain-action" :disabled="!ready" :aria-expanded="explanationOpen" aria-controls="explanation" @click="openExplanation">{{ t('AI explanation', 'AI 解释') }}</button></div>
            <details class="parameters"><summary>{{ t('More inputs', '更多参数') }}</summary>
              <fieldset :disabled="!ready" class="input-grid">
                <label for="loan-amount">{{ t('Amount · JPY', '金额 · JPY') }}<input id="loan-amount" v-model.number="draft.amount" type="number" min="1" max="10000000000" step="1" :aria-invalid="errors.amount" aria-describedby="amount-help"><small id="amount-help" :class="{ error: errors.amount }">{{ t('1–10,000,000,000; whole JPY.', '1–100 亿，整数日元。') }}</small></label>
                <label for="loan-rate">{{ t('Annual rate · %', '年利率 · %') }}<input id="loan-rate" v-model.number="draft.rate" type="number" min="0" max="20" step="0.1" :aria-invalid="errors.rate" aria-describedby="rate-help"><small id="rate-help" :class="{ error: errors.rate }">{{ t('0–20, fixed nominal annual rate.', '0–20，固定名义年利率。') }}</small></label>
              </fieldset>
              <button :disabled="!ready" @click="reset">{{ t('Reset', '重置') }}</button>
              <p class="point-readout">{{ t('Month', '月份') }} {{ selectedMonth }}: <span v-for="method in methods" :key="method.key">{{ method.label }} JPY {{ money(result[method.key].rows[selectedMonth - 1].payment) }}. </span></p>
            </details>
            <div class="results">
              <div class="summary-grid">
                <section v-for="method in methods" :key="method.key" :aria-labelledby="`${method.key}-heading`">
                  <h3 :id="`${method.key}-heading`">{{ method.label }}</h3>
                  <dl><div v-for="[key, label] in [['first', t('First month', '首月')], ['interest', t('Total interest', '总利息')]]" :id="`${method.key}-${key}`" :key="key" tabindex="-1"><dt>{{ label }}</dt><dd>{{ money(result[method.key][key]) }}</dd></div></dl>
                </section>
              </div>
              <p class="fine">{{ t('All amounts in JPY, rounded to 2 decimals for display.', '金额均为 JPY，展示保留两位小数。') }}</p>

            </div>
            <AiExplanationPanel v-if="explanationOpen" ref="aiPanel" :input="{ currency: 'JPY', amount: draft.amount, annualRatePct: draft.rate, months: draft.years * 12 }" :invalid="invalid" :locale="zh ? 'zh-CN' : 'en-US'" :client="aiClient" @close="closeExplanation" />
          </div>
        </section>
        <section id="tools" class="page-section"><h2>{{ t('Tools', '工具') }}</h2><div class="tools-grid">
          <article><h3>{{ t('Loan comparison', '贷款比较') }}</h3><p>{{ t('Compare fixed-rate repayment methods and explore how parameters affect outcomes.', '比较固定利率还款方式，探索参数如何影响结果。') }}</p><a class="text-action" :href="toolHref">{{ t('Explore the tool', '进入工具页') }} ↗</a></article>
          <article><h3>{{ t('AI stock screener', 'AI 筛股器') }}</h3><span class="badge planned">{{ t('Planned', '规划中') }}</span><p>{{ t('Planned: turn natural language into explicit filters. Screening and AI are not connected.', '计划将自然语言转为明确筛选条件；尚未接入筛选或 AI。') }}</p></article>
          <article><h3>{{ t('Japan tax calculator', '日本税务计算器') }}</h3><p>{{ t('2025 salary income / 2026 resident tax estimates. Enter confirmed deductions; limited scenarios only.', '2025 工资收入／2026 住民税概算。扣除额需自行确认，仅适用限定场景。') }}</p><a class="text-action" :href="zh ? '/zh/tools/japan-tax.html' : '/tools/japan-tax.html'">{{ t('Open the tax calculator', '打开税务计算器') }} ↗</a></article>
        </div></section>
        <section id="engineering" class="page-section"><h2>{{ t('Engineering', '工程') }}</h2><div class="engineering-grid"><div><h3 class="serif">{{ t('Behind the interface.', '界面背后的工程。') }}</h3><p>{{ t('Experience with data platforms for machine learning and configuration-driven engineering.', '为机器学习构建数据平台，让重复的数据流程成为可复用的系统。') }}</p></div><div class="experience"><article><span class="engineering-symbol" aria-hidden="true">⠿</span><div><h3>{{ t('Data for machine learning', '机器学习数据平台') }}</h3><p>{{ t('Worked on profile data pipelines and data integration supporting recommendation systems.', '曾参与支持推荐系统的个人资料数据管道与数据整合。') }}</p></div></article><article><span class="engineering-symbol" aria-hidden="true">⚙</span><div><h3>{{ t('Configuration-driven platforms', '配置驱动的工程') }}</h3><p>{{ t('Worked on data lake pipelines and reusable workflows driven by SQL and YAML.', '曾参与数据湖管道与 SQL、YAML 配置驱动的可复用数据流程。') }}</p></div></article></div></div>
          <details class="how"><summary>{{ t('How this preview works', '贷款预览如何实现') }}</summary><p>{{ t('Inputs are validated before deterministic calculations run. The chart and summary share the same result; explore monthly tables in the full tool. After sign-in, AI explains the current inputs and backend calculation summaries. It does not change the calculator results.', '输入通过校验后运行确定性计算。图表与摘要共用同一结果，完整月度表格可进入工具页探索。登录后，AI 根据当前参数和后端计算摘要生成解释，不改变计算器结果。') }}</p><p><a href="https://v.icbc.com.cn/userfiles/resources/wap/fenhang/shanghai/fengxian/txt/jrkj231120.pdf">{{ t('Repayment formulas · ICBC', '还款公式依据 · 工商银行') }} ↗</a></p></details>
          <div class="flow" :aria-label="t('Calculation flow', '计算流程')"><span>{{ t('Inputs', '输入') }}</span><span aria-hidden="true">→</span><span>{{ t('Calculation', '计算') }}</span><span aria-hidden="true">→</span><span>{{ t('Chart + table', '图表与数据') }}</span><span aria-hidden="true">→</span><span>{{ t('AI explanation', 'AI 解释') }} <small>{{ t('(sign-in required)', '（需登录）') }}</small></span></div>
          <div class="links"><a href="https://github.com/LucienZhang/goto">Goto · Go CLI ↗</a><a href="https://github.com/vuepress/vuepress-next/pull/460">{{ t('VuePress · contribution', 'VuePress · 开源贡献') }} ↗</a></div>
        </section>
        <section id="notes" class="page-section"><h2>{{ t('Notes', '笔记') }}</h2><a class="note-row" href="/programming/algorithms/overview.html"><span>{{ t('Algorithms', '算法笔记') }}</span><small v-if="zh" class="badge planned">英文内容</small><span aria-hidden="true">→</span></a><a class="note-row" href="/misc/apis.html"><span>{{ t('Web API Design', 'Web API 设计') }}</span><small v-if="zh" class="badge planned">英文内容</small><span aria-hidden="true">→</span></a><a class="note-row" :href="zh ? '/zh/ml/mnist.html' : '/ml/mnist.html'"><span>{{ t('Handwritten Digit Recognition', '手写数字识别') }}</span><span aria-hidden="true">→</span></a></section>
        <section id="contact" class="page-section contact"><h2>{{ t('Contact', '联系') }}</h2><h3 class="serif">{{ t('Let’s build something useful.', '一起做些有用的东西。') }}</h3><a class="email" href="mailto:lucienzhangzl@gmail.com">lucienzhangzl@gmail.com ↗</a><div class="links"><a href="https://github.com/LucienZhang">GitHub ↗</a><a href="https://www.linkedin.com/in/zhang-ziliang/">LinkedIn ↗</a></div></section>
      </main>
      <footer><span>© {{ page.frontmatter.copyrightYear }} Ziliang Zhang</span><a :href="other">{{ t('中文', 'EN') }}</a></footer>
    </div>
  </div>
  </template></SiteLayout>
</template>

<style scoped>
.homepage { --paper: #f7f4ed; --ink: #20231f; --accent: #b63824; --muted: #64665f; --line: #cbc7bd; background: var(--paper); color: var(--ink); color-scheme: light; min-height: 100vh; font: 16px/1.6 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
.homepage *, .homepage *::before, .homepage *::after { box-sizing: border-box; }
.page-wrap { max-width: 1360px; padding: 0 40px; margin: auto; }
.homepage h1, .homepage h2, .homepage h3, .homepage p, .homepage figure, .homepage dl { margin: 0; }
.homepage h1, .homepage h2, .homepage h3 { color: var(--ink); border: 0; padding: 0; font-weight: 500; }
.homepage h2 { font-size: 26px; line-height: 1.3; }
.homepage h3 { font-size: 21px; line-height: 1.4; }
.homepage p { margin-top: 12px; }
.homepage a { color: var(--accent); text-decoration: none; font-weight: 400; }
.homepage a:hover { text-decoration: underline; }
.homepage button, .homepage input, .homepage select { font: inherit; color: var(--ink); background: transparent; border: 1px solid #797b72; border-radius: 3px; min-height: 44px; }
.homepage button { padding: 8px 14px; cursor: pointer; }
.homepage button:hover:not(:disabled) { background: #eee7db; }
.homepage button:active:not(:disabled) { background: #e2d8c9; }
.homepage button:disabled, .homepage fieldset:disabled { opacity: .55; cursor: default; }
.homepage input, .homepage select { padding: 8px; max-width: 100%; width: 100%; }
.homepage :focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.homepage [tabindex='-1']:focus { outline: 2px solid var(--accent); outline-offset: 3px; }
.homepage fieldset { min-width: 0; border: 0; padding: 0; margin: 0; }
.homepage summary { min-height: 44px; padding: 10px 0; cursor: pointer; }
.homepage small, .fine { font-size: 14px; color: var(--muted); }
.homepage details { margin-top: 12px; }






footer a { min-width: 44px; justify-content: center; }


.skip { position: absolute; top: -100px; padding: 12px; background: var(--paper); z-index: 40; }
.skip:focus { top: 8px; }
.hero { display: grid; grid-template-columns: 1fr 2fr; gap: 44px; padding: 48px 0 64px; }
.identity { padding: 24px 0; }
.homepage h1 { font: 400 clamp(40px, 4vw, 60px)/1.15 Georgia, 'Times New Roman', serif; letter-spacing: -.025em; }
.chinese h1 { font-family: 'Songti SC', 'Noto Serif CJK SC', serif; line-height: 1.35; }
.intro { margin-top: 28px !important; max-width: 29ch; }
.homepage .text-action { border: 0; color: var(--accent); padding: 8px 0; text-align: left; }
.identity .text-action { margin-top: 28px; }
.secondary-link { display: block; min-height: 44px; padding: 10px 0; color: var(--muted) !important; }
.playground { min-width: 0; border-left: 1px solid var(--line); padding-left: 40px; scroll-margin-top: calc(var(--navbar-height) + 24px); }
.section-heading { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
.badge { font-size: 14px; line-height: 1.6; background: #f9e5df; color: #96301e; padding: 2px 8px; border-radius: 5px; display: inline-block; }
.badge.planned { background: #eae5d6; color: #605821; }
.assumptions { font-size: 14px; color: var(--muted); }
.chart { position: relative; margin-top: 20px !important; }
.chart figcaption { font-size: 14px; }
.legend { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 18px; font-size: 14px; }
.legend span::before { content: ''; width: 24px; display: inline-block; border-top: 2px solid var(--accent); vertical-align: middle; margin-right: 8px; }
.legend .principal::before { border-color: #6d681e; border-top-style: dashed; }
.term-controls { display: grid; grid-template-columns: auto 44px 1fr 44px auto; gap: 12px; align-items: center; margin-top: 16px !important; }
.term-controls button { padding: 0; font-size: 24px; }
.term-controls input { padding: 0; accent-color: var(--ink); min-width: 0; }
.term-controls output { min-width: 62px; font-variant-numeric: tabular-nums; }
.input-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.input-grid label { display: grid; gap: 4px; }
.point-readout { font-size: 14px; }
.results { border-top: 1px solid var(--line); margin-top: 16px; padding-top: 16px; }
.summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.summary-grid section { min-width: 0; }
.summary-grid h3 { font-size: 16px; margin-bottom: 8px; }
.summary-grid dl div { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 4px 8px; padding: 4px 0; font-size: 14px; }
.summary-grid dd { margin: 0; font-variant-numeric: tabular-nums; font-weight: 500; }
.summary-grid dt { color: var(--muted); }
.actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px; }
.homepage .primary { background: var(--accent); color: #fff; border-color: var(--accent); }
.homepage .primary:hover:not(:disabled) { background: #962c1b; }
.explanation { border-top: 3px solid var(--accent); margin-top: 24px; padding: 20px; background: #f0eade; }
.panel-heading { display: flex; align-items: start; gap: 16px; justify-content: space-between; }
.panel-heading h3 { font-size: 18px; }
.questions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.questions button { text-align: left; font-size: 14px; }
.question-input { display: flex; gap: 8px; }
.question-input input { min-width: 0; }
.explanation form { margin-top: 20px; }
.notice { padding: 12px; background: #e9e1c7; color: #514318; }
.error { color: #90231e !important; }
.notice.error { background: #f6e2db; }
.highlighted { background: #e9e1c7; outline: 2px solid var(--accent); }
.page-section { border-top: 1px solid var(--line); padding: 36px 0 48px; scroll-margin-top: calc(var(--navbar-height) + 16px); }
.page-section > h2 { color: var(--accent); margin-bottom: 28px; }
.tools-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
.tools-grid article { padding: 0 28px 0 0; border-right: 1px solid var(--line); }
.tools-grid article:last-child { padding-right: 0; border: 0; }
.tools-grid .badge { margin-top: 12px; }
.tools-grid p { max-width: 33ch; }
.tools-grid button { margin-top: 16px; }
.engineering-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 64px; }
.homepage .serif { font: 400 34px/1.25 Georgia, 'Times New Roman', serif; }
.chinese .serif { font-family: 'Songti SC', 'Noto Serif CJK SC', serif; }
.experience article { display: flex; gap: 24px; padding-bottom: 24px; }
.experience article + article { border-top: 1px solid var(--line); padding-top: 24px; }
.engineering-symbol { font-size: 36px; width: 44px; flex-shrink: 0; }
.how { margin-top: 28px !important; }
.flow { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 20px; padding: 20px; border: 1px solid var(--line); }
.links { display: flex; flex-wrap: wrap; gap: 12px 28px; margin-top: 20px; }
.links a { min-height: 44px; padding: 10px 0; }
.note-row { display: flex; gap: 16px; align-items: center; padding: 16px 8px; border-bottom: 1px solid var(--line); color: var(--ink) !important; }
.note-row > span:first-child { margin-right: auto; }
.note-row small { flex-shrink: 0; }
.email { display: inline-block; padding: 10px 0; overflow-wrap: anywhere; }
footer { display: flex; justify-content: space-between; gap: 20px; padding: 20px 0; border-top: 1px solid var(--line); font-size: 14px; align-items: center; }
footer a { display: flex; min-height: 44px; align-items: center; }
@media (max-width: 1100px) { .hero { gap: 28px; } .playground { padding-left: 28px; } .summary-grid { gap: 16px; } }
@media (max-width: 1023px) { .hero { grid-template-columns: 1fr; padding-top: 32px; } .identity { padding: 0; } .intro { max-width: 52ch; margin-top: 16px !important; } .identity .text-action { margin-top: 16px; } .secondary-link { display: inline-block; margin-left: 24px; } .playground { border-left: 0; border-top: 1px solid var(--line); padding: 24px 0 0; } .chart svg { max-height: 260px; } .engineering-grid { gap: 32px; } }
@media (max-width: 767px) {    .page-wrap { padding: 0 24px; }     .homepage h1 { font-size: 36px; } .homepage h2 { font-size: 23px; } .hero { padding: 28px 0 40px; gap: 24px; } .intro { font-size: 16px; } .secondary-link { margin-left: 12px; font-size: 14px; } .chart { margin-top: 16px !important; } .legend { justify-content: start; gap: 12px; } .term-controls { gap: 8px; } .term-controls output { min-width: 55px; font-size: 14px; } .page-section { padding: 28px 0 40px; } .page-section > h2 { margin-bottom: 20px; } .tools-grid, .engineering-grid { grid-template-columns: 1fr; gap: 24px; } .tools-grid article { border-right: 0; border-bottom: 1px solid var(--line); padding: 0 0 24px; } .tools-grid p { max-width: none; } .tools-grid button { margin-top: 8px; } .homepage .serif { font-size: 28px; } .experience article { gap: 16px; } .flow { padding: 16px; gap: 8px 12px; } .note-row { padding: 14px 0; gap: 8px; } .explanation { padding: 16px; } .panel-heading { flex-wrap: wrap; } .input-grid { grid-template-columns: 1fr; } }
@media (max-width: 389px) {   .page-wrap { padding: 0 20px; } .homepage h1 { font-size: 32px; }  .summary-grid { grid-template-columns: 1fr; } .term-controls { grid-template-columns: auto 44px 1fr 44px; } .term-controls output { grid-column: 3 / 5; text-align: right; } .note-row { flex-wrap: wrap; } .note-row > span:first-child { max-width: 100%; } .note-row small { font-size: 12px; } .secondary-link { margin-left: 0; } }
@media (prefers-reduced-motion: reduce) { .homepage *, .homepage *::before, .homepage *::after { scroll-behavior: auto !important; transition: none !important; animation: none !important; } }

.full-comparison{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:8px 14px;border:1px solid var(--accent);border-radius:3px;text-decoration:none}.full-comparison:focus-visible{outline:2px solid var(--accent);outline-offset:3px}

@media(max-width:767px){.hero{padding-top:12px;gap:16px}.identity{padding:0}.intro{margin-top:12px!important}.identity .text-action{margin-top:12px}}
</style>

<style>.site-layout .homepage { padding-top: var(--navbar-height); } .site-layout:has(.homepage) { color-scheme: light; } .site-layout:has(.homepage) .vp-navbar { background: #f7f4ed; }</style>

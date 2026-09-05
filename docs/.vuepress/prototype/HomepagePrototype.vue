<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { usePageData, useRouteLocale } from 'vuepress/client';
import { defaults, validate, calculate } from './loan.mjs';
const page = usePageData();
const locale = useRouteLocale();
const zh = computed(() => locale.value === '/zh/');
const t = (en, cn) => zh.value ? cn : en;
const ready = ref(false);
const menu = ref(false);
const menuToggle = ref(null);
const draft = ref({ ...defaults });
const result = ref(calculate(defaults));
const errors = computed(() => validate(draft.value));
const invalid = computed(() => Object.values(errors.value).some(Boolean));
const money = (n) => new Intl.NumberFormat(zh.value ? 'zh-CN' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const methods = computed(() => [{ key: 'payment', label: t('Equal payment', '等额本息') }, { key: 'principal', label: t('Equal principal', '等额本金') }]);
const nav = computed(() => [['tools', t('Tools', '工具')], ['engineering', t('Engineering', '工程')], ['notes', t('Notes', '笔记')], ['contact', t('Contact', '联系')]]);
const other = computed(() => zh.value ? '/preview/home.html' : '/zh/preview/home.html');
const selectedYear = ref(1);
const selectedMonth = computed(() => Math.min(result.value.months, (selectedYear.value - 1) * 12 + 1));
const maxY = computed(() => Math.ceil(Math.max(result.value.payment.first, result.value.principal.first) / 500) * 500);
const x = (month) => 62 + (month - 1) / (result.value.months - 1) * 618;
const y = (payment) => 224 - payment / maxY.value * 194;
const points = (key) => result.value[key].rows.map(row => `${x(row.month).toFixed(2)},${y(row.payment).toFixed(2)}`).join(' ');
const term = ref(null);
const trigger = ref(null);
const panel = ref(null);
const highlight = ref('');
const explanationOpen = ref(false);
const status = ref('ready');
const answer = ref(null);
const stale = ref(false);
const question = ref('');
const lastIntent = ref('curves');
const fixture = ref('success');
let timer;
const questions = computed(() => [
  ['curves', t('Why do the curves differ?', '为什么月供曲线不同？')],
  ['term', t('What does the term change?', '期限变化影响了什么？')],
  ['assumptions', t('What are the assumptions?', '这个例子有哪些假设？')],
]);
function cancel() { clearTimeout(timer); if (status.value === 'generating') status.value = 'cancelled'; }
watch(draft, () => {
  cancel();
  if (answer.value) stale.value = true;
  highlight.value = '';
  if (!invalid.value) {
    result.value = calculate(draft.value);
    selectedYear.value = Math.min(selectedYear.value, draft.value.years);
  }
}, { deep: true, flush: 'sync' });
function reset() { draft.value = { ...defaults }; selectedYear.value = 1; }
function focusTerm() { term.value?.focus(); term.value?.scrollIntoView({ block: 'center', behavior: 'instant' }); }
async function openExplanation() { explanationOpen.value = true; await nextTick(); panel.value?.focus(); }
async function closeExplanation() { cancel(); explanationOpen.value = false; await nextTick(); trigger.value?.focus(); }
function explain(intent) {
  if (invalid.value) return;
  cancel();
  lastIntent.value = intent;
  const snapshot = result.value;
  const language = zh.value;
  const mode = fixture.value;
  status.value = 'generating';
  timer = setTimeout(() => {
    if (mode !== 'success') { status.value = mode; return; }
    const i = snapshot.input;
    const format = n => new Intl.NumberFormat(language ? 'zh-CN' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
    let text;
    if (intent === 'assumptions') text = language
      ? '这个示例采用固定名义年利率，月利率为年利率 ÷ 12，按月末还款。未计税费、保险、提前还款或浮动利率。内部不逐期舍入，末期结清；展示金额四舍五入到分，可能存在分位加总差异。这不是银行报价或金融建议。'
      : 'This example uses a fixed nominal annual rate divided by 12 and end-of-month payments. It excludes fees, taxes, insurance, prepayments and variable rates. Calculations retain precision, with the balance cleared in the final month. Displayed cents may not add exactly. This is not a bank quote or financial advice.';
    else if (intent === 'term') text = language
      ? `当前快照为 ${i.years} 年，共 ${snapshot.months} 期。等额本息首月为 USD ${format(snapshot.payment.first)}，总利息为 USD ${format(snapshot.payment.interest)}。在本金和正利率不变时，延长期限会降低月供、增加总利息；零利率时总利息始终为零。这里描述一般规律，不将之前的参数当作比较基准。`
      : `This snapshot spans ${i.years} years and ${snapshot.months} payments. Equal payment starts at USD ${format(snapshot.payment.first)}, with USD ${format(snapshot.payment.interest)} total interest. At the same principal and a positive rate, a longer term lowers payments and increases total interest; at zero interest the total stays zero. This describes the general relationship, not a comparison against earlier inputs.`;
    else text = language
      ? `等额本息将月供保持平稳；等额本金每月偿还相同本金，利息随余额减少。这个快照的首月分别为 USD ${format(snapshot.payment.first)} 和 USD ${format(snapshot.principal.first)}，总利息分别为 USD ${format(snapshot.payment.interest)} 和 USD ${format(snapshot.principal.interest)}。${i.rate === 0 ? '零利率下两种曲线重合。' : '等额本金前期还款较高，本金下降更快。'}这不代表哪一种适合你。`
      : `Equal payment keeps monthly payments steady. Equal principal repays the same principal each month, so interest falls with the balance. This snapshot starts at USD ${format(snapshot.payment.first)} and USD ${format(snapshot.principal.first)}, with total interest of USD ${format(snapshot.payment.interest)} and USD ${format(snapshot.principal.interest)}, respectively. ${i.rate === 0 ? 'At zero interest both curves overlap.' : 'Equal principal pays down the balance faster, with higher early payments.'} This does not determine which method suits you.`;
    answer.value = { text, input: { ...i } }; stale.value = false; status.value = 'complete';
  }, 700);
}
function send() {
  const q = question.value.trim().toLowerCase();
  if (!q) return;
  const matched = questions.value.find(([, label]) => label.toLowerCase() === q);
  // Deliberately finite mock intents: unsupported questions must never invent a reply.
  if (matched) explain(matched[0]);
  else { cancel(); status.value = 'outside'; }
}
function cite(id) { if (stale.value || invalid.value) return; highlight.value = id; document.getElementById(id)?.focus(); }
const statusText = computed(() => ({
  ready: t('Choose a question to explore this result.', '选择一个问题，了解当前结果。'),
  generating: t('Generating an example explanation…', '正在生成示例解释…'),
  complete: t('Example explanation ready.', '示例解释已完成。'),
  cancelled: t('Cancelled. You can try again.', '已取消，可以重新生成。'),
  outside: t('This local mock supports only the three suggested questions. Select one above.', '本地 mock 仅支持上方三个推荐问题，请选择其中一个。'),
  error: t('Simulated network error. Retry when ready.', '模拟网络错误，可以重试。'),
  timeout: t('Simulated timeout. Retry when ready.', '模拟超时，可以重试。'),
  limited: t('Simulated rate limit. Switch the review fixture to success, then retry.', '模拟限流。将审阅状态改为成功后可重试。'),
}[status.value]));
watch(locale, () => { cancel(); reset(); menu.value = false; explanationOpen.value = false; answer.value = null; stale.value = false; status.value = 'ready'; question.value = ''; });
onMounted(() => { ready.value = true; });
onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <div id="prototype-top" class="prototype" :class="{ chinese: zh }">
    <div class="page-wrap">
      <a class="skip" href="#playground">{{ t('Skip to loan comparison', '跳到贷款比较') }}</a>
      <header class="masthead">
        <a href="#prototype-top" class="brand">{{ t('Ziliang', '张本人') }}</a>
        <nav @keydown.esc="menu = false; menuToggle?.focus()" id="prototype-nav" :class="{ expanded: menu }" :aria-label="t('Page sections', '页面区块')">
          <a v-for="[id, label] in nav" :key="id" :href="`#${id}`" @click="menu = false">{{ label }}</a>
        </nav>
        <a class="language" :href="other" :lang="zh ? 'en' : 'zh'" :aria-label="t('Switch to Chinese preview', '切换到英文预览')">{{ t('中文', 'EN') }}</a>
        <button ref="menuToggle" class="menu-button" :disabled="!ready" :aria-expanded="menu" aria-controls="prototype-nav" @click="menu = !menu" @keydown.esc="menu = false">{{ menu ? t('Close', '关闭') : t('Menu', '菜单') }} <span aria-hidden="true">☰</span></button>
      </header>
      <main aria-labelledby="prototype-title">
        <section class="hero">
          <div class="identity">
            <p class="eyebrow">{{ t('Ziliang Zhang', '张子良') }}</p>
            <h1 id="prototype-title">{{ t('Making data explorable and AI useful.', '让数据变得可探索，让 AI 变得有用。') }}</h1>
            <p class="intro">{{ t('AI applications, data, and backend engineering. Explore my tools and experiments.', '我关注 AI 应用、数据与后端工程。这里是我的工具与实验。') }}</p>
            <button class="text-action" :disabled="!ready" @click="focusTerm">{{ t('Try changing a parameter', '试着调整一下') }} <span aria-hidden="true">↓</span></button>
            <a class="secondary-link" href="#contact">{{ t('Get in touch', '联系我') }} <span aria-hidden="true">↗</span></a>
          </div>
          <div id="playground" class="playground">
            <div class="section-heading"><h2>{{ t('Loan comparison', '贷款比较') }}</h2><span class="badge">{{ t('Preview', '交互预览') }}</span></div>
            <p class="assumptions">USD {{ money(result.input.amount) }} · {{ result.input.rate }}% {{ t('fixed / year', '固定年利率') }} · {{ result.input.years }} {{ t('years', '年') }}<br>{{ t('Monthly payments. No taxes, fees or insurance. Illustrative assumptions.', '按月还款，不含税费及保险。仅为示例假设。') }}</p>
            <p v-if="!ready" class="notice">{{ t('JavaScript is off. The default chart and results below remain readable; interactive controls are disabled.', 'JavaScript 已关闭，以下默认图表和结果仍可阅读，交互控件已禁用。') }}</p>
            <p v-if="invalid" class="notice error" role="status">{{ t('Inputs are invalid. Showing the last valid result; explanation is paused.', '输入无效，当前保留最后有效结果，解释已暂停。') }}</p>
            <figure class="chart">
              <figcaption>{{ t('Monthly payment · USD', '月供 · USD') }}</figcaption>
              <div class="legend"><span class="payment">{{ methods[0].label }}</span><span class="principal">{{ methods[1].label }}</span></div>
              <svg viewBox="0 0 700 260" role="img" aria-labelledby="chart-title chart-description">
                <title id="chart-title">{{ t('Monthly payments over the loan term', '贷款期限内的月供变化') }}</title>
                <desc id="chart-description">{{ t('Solid red: equal payment. Dashed olive: equal principal. Exact values are in the summary and full monthly table below.', '红色实线为等额本息，橄榄色虚线为等额本金。精确值见下方摘要与完整月度数据表。') }}</desc>
                <g v-for="fraction in [0, 0.5, 1]" :key="fraction"><line x1="62" x2="680" :y1="y(maxY * fraction)" :y2="y(maxY * fraction)" class="grid-line"/><text x="52" :y="y(maxY * fraction) + 5" text-anchor="end">{{ Math.round(maxY * fraction).toLocaleString('en-US') }}</text></g>
                <path d="M62 24V224H684" class="axis"/>
                <polyline :points="points('payment')" class="curve payment-line"/><polyline :points="points('principal')" class="curve principal-line"/>
                <line :x1="x(selectedMonth)" :x2="x(selectedMonth)" y1="25" y2="224" class="cursor-line"/>
                <circle v-for="method in methods" :key="method.key" :cx="x(selectedMonth)" :cy="y(result[method.key].rows[selectedMonth - 1].payment)" r="4" :class="`${method.key}-dot`"/>
                <text x="62" y="248">{{ t('Year 1', '第 1 年') }}</text><text x="680" y="248" text-anchor="end">{{ result.input.years }} {{ t('years', '年') }}</text>
              </svg>
            </figure>
            <fieldset class="term-controls" :disabled="!ready">
              <label for="loan-years">{{ t('Term', '年限') }}</label>
              <button :disabled="draft.years <= 1" :aria-label="t('Decrease term by one year', '年限减少一年')" @click="draft.years--">−</button>
              <input id="loan-years" ref="term" v-model.number="draft.years" type="range" min="1" max="40" step="1" :aria-valuetext="`${draft.years} ${t('years', '年')}`">
              <button :disabled="draft.years >= 40" :aria-label="t('Increase term by one year', '年限增加一年')" @click="draft.years++">+</button>
              <output for="loan-years">{{ draft.years }} {{ t('years', '年') }}</output>
            </fieldset>
              <div class="actions"><button ref="trigger" class="primary" :disabled="!ready" :aria-expanded="explanationOpen" aria-controls="explanation" @click="openExplanation">{{ t('Explain the difference', '解释差异') }}</button><button :disabled="!ready" @click="reset">{{ t('Reset', '重置') }}</button></div>
            <details class="parameters"><summary>{{ t('More inputs & chart detail', '更多参数与图表明细') }}</summary>
              <fieldset :disabled="!ready" class="input-grid">
                <label for="loan-amount">{{ t('Amount · USD', '金额 · USD') }}<input id="loan-amount" v-model.number="draft.amount" type="number" min="1000" max="10000000" step="0.01" :aria-invalid="errors.amount" aria-describedby="amount-help"><small id="amount-help" :class="{ error: errors.amount }">{{ t('1,000–10,000,000; up to 2 decimal places.', '1,000–10,000,000，最多两位小数。') }}</small></label>
                <label for="loan-rate">{{ t('Annual rate · %', '年利率 · %') }}<input id="loan-rate" v-model.number="draft.rate" type="number" min="0" max="20" step="any" :aria-invalid="errors.rate" aria-describedby="rate-help"><small id="rate-help" :class="{ error: errors.rate }">{{ t('0–20, fixed nominal annual rate.', '0–20，固定名义年利率。') }}</small></label>
                <label for="chart-year">{{ t('Inspect the first month of year', '查看某年的第一个月') }}<select id="chart-year" v-model.number="selectedYear"><option v-for="n in result.input.years" :key="n" :value="n">{{ n }}</option></select></label>
              </fieldset>
              <p class="point-readout">{{ t('Month', '月份') }} {{ selectedMonth }}: <span v-for="method in methods" :key="method.key">{{ method.label }} USD {{ money(result[method.key].rows[selectedMonth - 1].payment) }}. </span></p>
            </details>
            <div class="results">
              <div class="summary-grid">
                <section v-for="method in methods" :key="method.key" :aria-labelledby="`${method.key}-heading`">
                  <h3 :id="`${method.key}-heading`">{{ method.label }}</h3>
                  <dl><div v-for="[key, label] in [['first', t('First month', '首月')], ['last', t('Last month', '末月')], ['interest', t('Total interest', '总利息')]]" :id="`${method.key}-${key}`" :key="key" tabindex="-1" :class="{ highlighted: highlight === `${method.key}-${key}` }"><dt>{{ label }}</dt><dd>{{ money(result[method.key][key]) }}</dd></div></dl>
                </section>
              </div>
              <p class="fine">{{ t('All amounts in USD, rounded to cents for display.', '金额均为 USD，展示时四舍五入到分。') }}</p>

            </div>
            <section v-if="explanationOpen" id="explanation" class="explanation" aria-labelledby="explanation-title" @keydown.esc.stop="closeExplanation">
              <div class="panel-heading"><h3 id="explanation-title" ref="panel" tabindex="-1">{{ t('Example explanation · AI not connected', '示例解释 · AI 未连接') }}</h3><button @click="closeExplanation">{{ t('Close', '关闭') }}</button></div>
              <p class="fine">{{ t('Local mock, using a snapshot of the calculation above.', '本地 mock，读取上方计算结果的快照。') }}</p>
              <div class="questions"><button v-for="[intent, label] in questions" :key="intent" :disabled="invalid || status === 'generating'" @click="explain(intent)">{{ label }}</button></div>
              <p role="status" aria-live="polite">{{ statusText }}</p>
              <button v-if="status === 'generating'" @click="cancel">{{ t('Cancel', '取消') }}</button>
              <template v-if="answer"><p v-if="stale" class="notice">{{ t('Based on previous inputs. This answer does not describe the current result.', '基于之前的参数，此回答不代表当前结果。') }}</p><p class="fine">{{ t('Answer snapshot', '回答快照') }}: USD {{ money(answer.input.amount) }} · {{ answer.input.rate }}% · {{ answer.input.years }} {{ t('years', '年') }}</p><p>{{ answer.text }}</p>
                <div class="actions"><button :disabled="stale || invalid" @click="cite('payment-first')">{{ t('Locate first month', '定位首月') }}</button><button :disabled="stale || invalid" @click="cite('payment-interest')">{{ t('Locate total interest', '定位总利息') }}</button><button v-if="highlight" @click="highlight = ''">{{ t('Clear highlight', '取消高亮') }}</button></div>
              </template>
              <button v-if="stale || ['error', 'timeout', 'limited', 'cancelled'].includes(status)" :disabled="invalid || status === 'generating'" @click="explain(lastIntent)">{{ stale ? t('Update explanation', '更新解释') : t('Retry', '重试') }}</button>
              <form @submit.prevent="send"><label for="mock-question">{{ t('Ask a suggested question', '输入推荐问题') }}</label><div class="question-input"><input id="mock-question" v-model="question" maxlength="300" :disabled="status === 'generating'" :placeholder="questions[0][1]"><button type="submit" :disabled="!question.trim() || invalid || status === 'generating'">{{ t('Send', '发送') }}</button></div></form>
              <details class="review-controls"><summary>{{ t('Prototype review: simulated states', '原型审阅：模拟状态') }}</summary><label for="mock-fixture">{{ t('Next reply', '下一次回答') }}<select id="mock-fixture" v-model="fixture"><option value="success">{{ t('Success', '成功') }}</option><option value="error">{{ t('Network error (simulated)', '网络错误（模拟）') }}</option><option value="timeout">{{ t('Timeout (simulated)', '超时（模拟）') }}</option><option value="limited">{{ t('Rate limit (simulated)', '限流（模拟）') }}</option></select></label></details>
            </section>
            <details class="data"><summary>{{ t('View all monthly data', '查看完整月度数据') }}</summary><p class="fine">{{ t('Unrounded balances drive the calculation. Display rounding can cause small sum differences.', '使用未舍入余额计算，展示值相加可能存在分位误差。') }}</p>
              <details v-for="method in methods" :key="method.key"><summary>{{ method.label }} · {{ result.months }} {{ t('months', '期') }}</summary><div class="table-scroll" tabindex="0" role="region" :aria-label="`${method.label} ${t('monthly schedule', '月度还款表')}`"><table><caption>{{ method.label }} · USD</caption><thead><tr><th scope="col">{{ t('Month', '月份') }}</th><th scope="col">{{ t('Payment', '还款') }}</th><th scope="col">{{ t('Principal', '本金') }}</th><th scope="col">{{ t('Interest', '利息') }}</th><th scope="col">{{ t('Balance', '余额') }}</th></tr></thead><tbody><tr v-for="row in result[method.key].rows" :key="row.month"><th scope="row">{{ row.month }}</th><td v-for="key in ['payment', 'principal', 'interest', 'balance']" :key="key">{{ money(row[key]) }}</td></tr></tbody></table></div></details>
            </details>
          </div>
        </section>
        <section id="tools" class="page-section"><h2>{{ t('Tools', '工具') }}</h2><div class="tools-grid">
          <article><h3>{{ t('Loan comparison', '贷款比较') }}</h3><span class="badge">{{ t('Preview', '预览') }}</span><p>{{ t('Explore repayment structures and see how assumptions shape outcomes.', '比较还款方式，探索参数如何影响结果。') }}</p><button class="text-action" :disabled="!ready" @click="focusTerm">{{ t('Try above', '返回上方体验') }} ↑</button></article>
          <article><h3>{{ t('AI stock screener', 'AI 筛股器') }}</h3><span class="badge planned">{{ t('Planned', '规划中') }}</span><p>{{ t('Turn natural language into explicit filters and inspect the results.', '将自然语言转为明确条件，查看筛选依据与结果。') }}</p></article>
          <article><h3>{{ t('Japan tax calculator', '日本税务计算器') }}</h3><span class="badge planned">{{ t('Planned', '规划中') }}</span><p>{{ t('Explore tax rules through clear inputs and a transparent breakdown.', '用清晰的输入与计算明细理解税务规则。') }}</p></article>
        </div></section>
        <section id="engineering" class="page-section"><h2>{{ t('Engineering', '工程') }}</h2><div class="engineering-grid"><div><h3 class="serif">{{ t('Behind the interface.', '界面背后的工程。') }}</h3><p>{{ t('Experience with data platforms for machine learning and configuration-driven engineering.', '为机器学习构建数据平台，让重复的数据流程成为可复用的系统。') }}</p></div><div class="experience"><article><span class="engineering-symbol" aria-hidden="true">⠿</span><div><h3>{{ t('Data for machine learning', '机器学习数据平台') }}</h3><p>{{ t('Worked on profile data pipelines and data integration supporting recommendation systems.', '曾参与支持推荐系统的个人资料数据管道与数据整合。') }}</p></div></article><article><span class="engineering-symbol" aria-hidden="true">⚙</span><div><h3>{{ t('Configuration-driven platforms', '配置驱动的工程') }}</h3><p>{{ t('Worked on data lake pipelines and reusable workflows driven by SQL and YAML.', '曾参与数据湖管道与 SQL、YAML 配置驱动的可复用数据流程。') }}</p></div></article></div></div>
          <details class="how"><summary>{{ t('How this preview works', '贷款预览如何实现') }}</summary><p>{{ t('Inputs are validated before deterministic calculations run. The SVG and tables share the same result. The local explanation mock reads a snapshot and cannot alter the calculation.', '输入通过校验后运行确定性计算。SVG 与表格共用同一结果。本地解释 mock 读取快照，不能改变计算。') }}</p><p><a href="https://v.icbc.com.cn/userfiles/resources/wap/fenhang/shanghai/fengxian/txt/jrkj231120.pdf">{{ t('Repayment formulas · ICBC', '还款公式依据 · 工商银行') }} ↗</a></p></details>
          <div class="flow" :aria-label="t('Calculation flow', '计算流程')"><span>{{ t('Inputs', '输入') }}</span><span aria-hidden="true">→</span><span>{{ t('Calculation', '计算') }}</span><span aria-hidden="true">→</span><span>{{ t('Chart + table', '图表与数据') }}</span><span aria-hidden="true">→</span><span>{{ t('AI explanation', 'AI 解释') }} <small>{{ t('(local mock)', '（本地 mock）') }}</small></span></div>
          <div class="links"><a href="https://github.com/LucienZhang/goto">Goto · Go CLI ↗</a><a href="https://github.com/vuepress/vuepress-next/pull/460">{{ t('VuePress · contribution', 'VuePress · 开源贡献') }} ↗</a></div>
        </section>
        <section id="notes" class="page-section"><h2>{{ t('Notes', '笔记') }}</h2><a class="note-row" href="/programming/algorithms/overview.html"><span>{{ t('Algorithms', '算法笔记') }}</span><small v-if="zh" class="badge planned">英文内容</small><span aria-hidden="true">→</span></a><a class="note-row" href="/misc/apis.html"><span>{{ t('Web API Design', 'Web API 设计') }}</span><small v-if="zh" class="badge planned">英文内容</small><span aria-hidden="true">→</span></a><a class="note-row" :href="zh ? '/zh/ml/mnist.html' : '/ml/mnist.html'"><span>{{ t('Handwritten Digit Recognition', '手写数字识别') }}</span><span aria-hidden="true">→</span></a></section>
        <section id="contact" class="page-section contact"><h2>{{ t('Contact', '联系') }}</h2><h3 class="serif">{{ t('Let’s build something useful.', '一起做些有用的东西。') }}</h3><a class="email" href="mailto:lucienzhangzl@gmail.com">lucienzhangzl@gmail.com ↗</a><div class="links"><a href="https://github.com/LucienZhang">GitHub ↗</a><a href="https://www.linkedin.com/in/zhang-ziliang/">LinkedIn ↗</a></div></section>
      </main>
      <footer><span>© {{ page.frontmatter.copyrightYear }} Ziliang Zhang</span><a :href="other">{{ t('中文', 'EN') }}</a></footer>
    </div>
  </div>
</template>

<style scoped>
.prototype { --paper: #f7f4ed; --ink: #20231f; --accent: #b63824; --muted: #64665f; --line: #cbc7bd; background: var(--paper); color: var(--ink); color-scheme: light; min-height: 100vh; font: 16px/1.6 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
.prototype *, .prototype *::before, .prototype *::after { box-sizing: border-box; }
.page-wrap { max-width: 1360px; padding: 0 40px; margin: auto; }
.prototype h1, .prototype h2, .prototype h3, .prototype p, .prototype figure, .prototype dl { margin: 0; }
.prototype h1, .prototype h2, .prototype h3 { color: var(--ink); border: 0; padding: 0; font-weight: 500; }
.prototype h2 { font-size: 26px; line-height: 1.3; }
.prototype h3 { font-size: 21px; line-height: 1.4; }
.prototype p { margin-top: 12px; }
.prototype a { color: var(--accent); text-decoration: none; font-weight: 400; }
.prototype a:hover { text-decoration: underline; }
.prototype button, .prototype input, .prototype select { font: inherit; color: var(--ink); background: transparent; border: 1px solid #797b72; border-radius: 3px; min-height: 44px; }
.prototype button { padding: 8px 14px; cursor: pointer; }
.prototype button:hover:not(:disabled) { background: #eee7db; }
.prototype button:active:not(:disabled) { background: #e2d8c9; }
.prototype button:disabled, .prototype fieldset:disabled { opacity: .55; cursor: default; }
.prototype input, .prototype select { padding: 8px; max-width: 100%; width: 100%; }
.prototype :focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.prototype [tabindex='-1']:focus { outline: 2px solid var(--accent); outline-offset: 3px; }
.prototype fieldset { min-width: 0; border: 0; padding: 0; margin: 0; }
.prototype summary { min-height: 44px; padding: 10px 0; cursor: pointer; }
.prototype small, .fine { font-size: 14px; color: var(--muted); }
.prototype details { margin-top: 12px; }
.masthead { display: flex; align-items: center; gap: 28px; min-height: 96px; border-bottom: 1px solid var(--line); }
.prototype .brand { font: 400 1.8rem Sacramento, cursive; color: var(--ink); margin-right: auto; min-height: 44px; display: flex; align-items: center; }
.chinese .brand { font-family: Slidefu, cursive; font-size: 2rem; }
.masthead nav { display: flex; gap: 28px; }
.masthead nav a, .language { display: flex; align-items: center; min-height: 44px; }
.language, footer a { min-width: 44px; justify-content: center; }
.masthead nav a { color: var(--ink); min-width: 44px; }
.menu-button { display: none; }
.skip { position: absolute; top: -100px; padding: 12px; background: var(--paper); z-index: 10; }
.skip:focus { top: 8px; }
.hero { display: grid; grid-template-columns: 1fr 2fr; gap: 44px; padding: 48px 0 64px; }
.identity { padding: 24px 0; }
.eyebrow { font-size: 14px; color: var(--muted); margin-bottom: 16px !important; }
.prototype h1 { font: 400 clamp(40px, 4vw, 60px)/1.15 Georgia, 'Times New Roman', serif; letter-spacing: -.025em; }
.chinese h1 { font-family: 'Songti SC', 'Noto Serif CJK SC', serif; line-height: 1.35; }
.intro { margin-top: 28px !important; max-width: 29ch; }
.prototype .text-action { border: 0; color: var(--accent); padding: 8px 0; text-align: left; }
.identity .text-action { margin-top: 28px; }
.secondary-link { display: block; min-height: 44px; padding: 10px 0; color: var(--muted) !important; }
.playground { min-width: 0; border-left: 1px solid var(--line); padding-left: 40px; scroll-margin-top: 24px; }
.section-heading { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
.badge { font-size: 14px; line-height: 1.6; background: #f9e5df; color: #96301e; padding: 2px 8px; border-radius: 5px; display: inline-block; }
.badge.planned { background: #eae5d6; color: #605821; }
.assumptions { font-size: 14px; color: var(--muted); }
.chart { position: relative; margin-top: 20px !important; }
.chart figcaption { font-size: 14px; }
.legend { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 18px; font-size: 14px; }
.legend span::before { content: ''; width: 24px; display: inline-block; border-top: 2px solid var(--accent); vertical-align: middle; margin-right: 8px; }
.legend .principal::before { border-color: #6d681e; border-top-style: dashed; }
.chart svg { width: 100%; height: auto; display: block; overflow: visible; }
.chart text { fill: var(--muted); font: 14px sans-serif; }
.grid-line { stroke: var(--line); stroke-width: .7; }
.axis { fill: none; stroke: var(--ink); }
.curve { fill: none; stroke-width: 2.5; vector-effect: non-scaling-stroke; }
.payment-line { stroke: var(--accent); }
.principal-line { stroke: #6d681e; stroke-dasharray: 7 5; }
.cursor-line { stroke: #797b72; stroke-dasharray: 2 5; }
.payment-dot { fill: var(--accent); }
.principal-dot { fill: #6d681e; }
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
.prototype .primary { background: var(--accent); color: #fff; border-color: var(--accent); }
.prototype .primary:hover:not(:disabled) { background: #962c1b; }
.explanation { border-top: 3px solid var(--accent); margin-top: 24px; padding: 20px; background: #f0eade; }
.panel-heading { display: flex; align-items: start; gap: 16px; justify-content: space-between; }
.panel-heading h3 { font-size: 18px; }
.questions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.questions button { text-align: left; font-size: 14px; }
.question-input { display: flex; gap: 8px; }
.question-input input { min-width: 0; }
.explanation form { margin-top: 20px; }
.review-controls label { display: grid; gap: 8px; }
.notice { padding: 12px; background: #e9e1c7; color: #514318; }
.error { color: #90231e !important; }
.notice.error { background: #f6e2db; }
.highlighted { background: #e9e1c7; outline: 2px solid var(--accent); }
.data { border-bottom: 1px solid var(--line); }
.table-scroll { overflow: auto; max-height: 380px; }
.prototype table { display: table; border-collapse: collapse; margin: 8px 0; width: 100%; font-size: 14px; }
.prototype th, .prototype td { border: 1px solid var(--line); padding: 8px; white-space: nowrap; text-align: right; }
.prototype tr, .prototype tr:nth-child(2n) { background: transparent; border: 0; }
.page-section { border-top: 1px solid var(--line); padding: 36px 0 48px; scroll-margin-top: 16px; }
.page-section > h2 { color: var(--accent); margin-bottom: 28px; }
.tools-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
.tools-grid article { padding: 0 28px 0 0; border-right: 1px solid var(--line); }
.tools-grid article:last-child { padding-right: 0; border: 0; }
.tools-grid .badge { margin-top: 12px; }
.tools-grid p { max-width: 33ch; }
.tools-grid button { margin-top: 16px; }
.engineering-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 64px; }
.prototype .serif { font: 400 34px/1.25 Georgia, 'Times New Roman', serif; }
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
@media (max-width: 767px) { .page-wrap { padding: 0 24px; } .masthead { min-height: 76px; gap: 16px; flex-wrap: wrap; padding: 12px 0; } .masthead nav { display: none; order: 4; width: 100%; flex-wrap: wrap; gap: 8px 24px; } .masthead nav.expanded { display: flex; } .menu-button { display: block; } .prototype h1 { font-size: 36px; } .prototype h2 { font-size: 23px; } .hero { padding: 28px 0 40px; gap: 24px; } .eyebrow { margin-bottom: 8px !important; } .intro { font-size: 16px; } .secondary-link { margin-left: 12px; font-size: 14px; } .chart { margin-top: 16px !important; } .legend { justify-content: start; gap: 12px; } .chart text { font-size: 24px; } .term-controls { gap: 8px; } .term-controls output { min-width: 55px; font-size: 14px; } .page-section { padding: 28px 0 40px; } .page-section > h2 { margin-bottom: 20px; } .tools-grid, .engineering-grid { grid-template-columns: 1fr; gap: 24px; } .tools-grid article { border-right: 0; border-bottom: 1px solid var(--line); padding: 0 0 24px; } .tools-grid p { max-width: none; } .tools-grid button { margin-top: 8px; } .prototype .serif { font-size: 28px; } .experience article { gap: 16px; } .flow { padding: 16px; gap: 8px 12px; } .note-row { padding: 14px 0; gap: 8px; } .explanation { padding: 16px; } .panel-heading { flex-wrap: wrap; } .input-grid { grid-template-columns: 1fr; } }
@media (max-width: 389px) { .page-wrap { padding: 0 20px; } .prototype h1 { font-size: 32px; } .masthead { gap: 12px; } .summary-grid { grid-template-columns: 1fr; } .term-controls { grid-template-columns: auto 44px 1fr 44px; } .term-controls output { grid-column: 3 / 5; text-align: right; } .note-row { flex-wrap: wrap; } .note-row > span:first-child { max-width: 100%; } .note-row small { font-size: 12px; } .secondary-link { margin-left: 0; } }
@media (prefers-reduced-motion: reduce) { .prototype *, .prototype *::before, .prototype *::after { scroll-behavior: auto !important; transition: none !important; animation: none !important; } }
</style>

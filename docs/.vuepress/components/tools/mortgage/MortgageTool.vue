<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vuepress/client';
import { parseMortgageQuery } from '../../../lib/loan/handoff.mjs';
import { validStart, calendarMonth, periodAt } from './calendar.mjs';
import MonthPicker from './MonthPicker.vue';
import MortgageChart from './MortgageChart.vue';
import { defaults, errors, compare, crossings, metricPoints } from './model.mjs';
const props = defineProps({ lang: { type: String, default: 'en' } });
const zh = computed(() => props.lang === 'zh');
const t = (en, cn) => zh.value ? cn : en;
const currency = computed(() => t('JPY','日元'));
const startDraft = ref('2026-09'), calendarStart = ref('2026-09');
watch(startDraft, value => { if(validStart(value)) calendarStart.value=value; });
const input = reactive(structuredClone(defaults));
const ready = ref(false), month = ref(168);
const invalid = computed(() => errors(input));
const result = ref(compare(defaults));
const route = useRoute();
function applyQuery() {
  const values = parseMortgageQuery(route.query);
  const next = structuredClone(defaults);
  if (values) {
    next.amount = values.amount;
    for (const id of ['a', 'b']) Object.assign(next[id], { rate: values.rate, months: values.months });
  }
  Object.assign(input, next);
}
onMounted(() => { applyQuery(); ready.value = true; });
watch(() => route.query, () => { if (ready.value) applyQuery(); });
watch(input, () => { if (!Object.keys(invalid.value).length) { result.value = compare(input); month.value = Math.min(month.value, result.value.months); } });
const amountText = computed(() => Number.isInteger(input.amount) ? input.amount.toLocaleString('en-US') : String(input.amount));
const magnitude = computed(() => {
  if (invalid.value.amount) return '';
  const units = zh.value ? [[1e8,'亿'],[1e7,'千万'],[1e4,'万']] : [[1e9,' billion'],[1e6,' million'],[1e3,' thousand']];
  const unit = units.find(([scale]) => input.amount >= scale);
  return unit ? new Intl.NumberFormat(zh.value ? 'zh-CN' : 'en-US', {maximumFractionDigits: 4}).format(input.amount / unit[0]) + unit[1] : String(input.amount);
});
async function editAmount(event) {
  const el = event.target;
  const raw = el.value;
  const digitsBefore = raw.slice(0, el.selectionStart).replaceAll(',', '').length;
  const plain = raw.replaceAll(',', '');
  input.amount = /^\d+$/.test(plain) ? Number(plain) : plain;
  await nextTick();
  el.value = amountText.value;
  let position = 0, count = 0;
  while (position < el.value.length && count < digitsBefore) { if (el.value[position] !== ',') count++; position++; }
  el.setSelectionRange(position, position);
}
const viewedDate = ref(calendarMonth(calendarStart.value, month.value));
const monthInvalid = computed(() => {
  const period = periodAt(calendarStart.value, viewedDate.value);
  return !Number.isInteger(period) || period < 0 || period > result.value.months;
});
watch(viewedDate, value => { if (!monthInvalid.value) month.value = periodAt(calendarStart.value,value); });
watch([calendarStart, month], () => viewedDate.value = calendarMonth(calendarStart.value,month.value));
const selected = computed(() => result.value.rows[month.value]);
const money = value => new Intl.NumberFormat(zh.value ? 'zh-CN' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(value) < 0.000005 ? 0 : value);
const method = key => key === 'payment' ? t('Equal payment', '元利均等（等额本息）') : t('Equal principal', '元金均等（等额本金）');
const pair = (metric, start) => ['a','b'].map(id => ({ label: id.toUpperCase() + ' · ' + method(result.value.input[id].method), points: result.value.rows.slice(start).map(row => ({month:row.month,value:row[id][metric]})) }));
const delta = (metric, start) => [{label: 'A − B', points: metricPoints(result.value, metric, start)}];
const viewOptions = computed(() => [
  {key:'payment',title:t('Monthly payment','当期月供'),metric:'payment',start:1},
  {key:'interest',title:t('Monthly interest','当期利息'),metric:'interest',start:1},
  {key:'interest-difference',option:t('Monthly interest A − B','当期利息差 A − B'),title:t('Monthly interest difference A − B','当期利息差 A − B'),metric:'interest',start:1,difference:true},
  {key:'cumulative-difference',option:t('Cumulative interest A − B','累计利息差 A − B'),title:t('Cumulative interest difference A − B','累计利息差 A − B'),metric:'cumulative',start:0,difference:true},
  {key:'cumulative',title:t('Cumulative interest','累计利息'),metric:'cumulative',start:0},
  {key:'balance',title:t('Remaining principal','剩余本金'),metric:'balance',start:0},
]);
const maxViews = 6;
const views = ref([{id:'view-1',mode:'payment'},{id:'view-2',mode:'cumulative-difference'}]);
let nextView = 3;
const charts = computed(() => views.value.map(view => {
  const option = viewOptions.value.find(option => option.key === view.mode);
  return {...option,id:view.id,series:option.difference ? delta(option.metric,option.start) : pair(option.metric,option.start)};
}));
async function addView() {
  if(views.value.length>=maxViews) return;
  const id = `view-${nextView++}`;
  views.value.push({id,mode:'interest'});
  await nextTick(); document.getElementById(id+'-mode')?.focus();
}
async function removeView(id) {
  if(views.value.length===1) return;
  const index=views.value.findIndex(view=>view.id===id);
  views.value.splice(index,1);
  await nextTick(); document.getElementById(views.value[Math.min(index,views.value.length-1)].id+'-mode')?.focus();
}
function analysis(chart) { return crossings(metricPoints(result.value, chart.metric, chart.start)); }
function summary(chart) {
  if (chart.series.length === 1) return t('Difference A minus B: positive means A is higher; negative means B is higher.','差额 A − B：正值表示 A 更高，负值表示 B 更高。');
  const c = analysis(chart);
  if (c.coincident) return t('The two series coincide throughout this interval.', '两方案在此区间全程重合。');
  const equal = c.equal.length ? t(`Equal at month ${c.equal[0]}${c.equal.length > 1 ? ` (${c.equal.length} equal months)` : ''}. `, `第 ${c.equal[0]} 月相等${c.equal.length > 1 ? `（共 ${c.equal.length} 个相等月份）` : ''}。`) : '';
  if (!c.flips.length) return equal + t('No sign reversal in this interval.', '此区间没有高低关系反转。');
  const f = c.flips[0];
  return equal + t(`First reversal at month ${f.first}: ${f.sign > 0 ? 'B' : 'A'} is lower. Linear interpolation ≈ ${f.month.toFixed(1)} months; ${c.flips.length} reversal(s).`, `首次反转在第 ${f.first} 期：${f.sign > 0 ? 'B' : 'A'} 更低。跨月线性插值 ≈ ${f.month.toFixed(1)} 月；共 ${c.flips.length} 次反转。`);
}
function markers(chart) {
  const c = analysis(chart);
  return c.flips.map(f => {
    const list = chart.series[0].points;
    const left = list.find(p => p.month === Math.floor(f.month));
    const right = list.find(p => p.month === Math.ceil(f.month));
    return {month:f.month,value:left.value + (right.value-left.value)*(f.month-left.month)};
  });
}
const payoff = computed(() => result.value.input.a.months === result.value.input.b.months ? [{month:result.value.input.a.months,label:t('A/B payoff','A/B 结清')}] : ['a','b'].map(id => ({month:result.value.input[id].months,label:id.toUpperCase()+t(' payoff',' 结清')})));
const page = ref(0);
watch(month, () => page.value = Math.floor(month.value / 24));
watch(result, () => page.value = Math.min(page.value, Math.floor(result.value.months / 24)));
const tableRows = computed(() => result.value.rows.slice(page.value * 24, page.value * 24 + 24));
</script>
<template>
<div class="mortgage" :lang="lang" :class="{chinese:zh}">
  <h1>{{ t('Compare mortgage plans','房贷方案比较') }}</h1>
  <p class="intro">{{ t('One loan. See how payments and interest evolve.','同一笔贷款，看清月供与利息的变化。') }}</p>
  <p class="muted">{{ t('Fixed nominal rates · Monthly payments · JPY example · Excludes fees and other charges','固定名义年利率 · 按月期末还款 · 日元示例 · 不含手续费等额外费用') }}</p>
  <noscript>{{ t('JavaScript is required to edit. The default example and data remain available below.','调整参数需要 JavaScript；以下为默认示例及数据。') }}</noscript>
  <fieldset class="controls" :disabled="!ready">
    <legend class="sr-only">{{ t('Comparison inputs','比较参数') }}</legend>
    <div class="amount-row"><label class="amount" for="amount">{{ t('Principal','本金') }}<input id="amount" :value="amountText" @input="editAmount" type="text" inputmode="numeric" :aria-invalid="!!invalid.amount" aria-describedby="amount-help amount-scale"/></label><span id="amount-scale" class="magnitude">{{ magnitude }}</span></div>
    <p v-if="invalid.amount" id="amount-help" class="error">{{ t('Enter a whole number from 1 to 10,000,000,000.','请输入 1–100 亿之间的整数。') }}</p><span v-else id="amount-help" class="sr-only">{{ t('Whole numbers, up to 10 billion.','整数，最高 100 亿。') }}</span>
    <div class="calendar-start date-field"><span>{{ t('First repayment month','首期还款月份') }}</span><MonthPicker id="calendar-start" min="1900-01" max="2200-12" v-model="startDraft" :lang="lang" :label="t('First repayment month','首期还款月份')" :disabled="!ready" :aria-invalid="!validStart(startDraft)" aria-describedby="calendar-help"/></div><p id="calendar-help" class="calendar-help" :class="{error:!validStart(startDraft)}">{{ !validStart(startDraft) ? t('Choose a month between 1900 and 2200.','请选择 1900–2200 年之间的月份。') : t('Period 1 is this month; period 0 is the previous month. Dates do not change the calculation.', '第 1 期对应此月，第 0 期为前一个月；日期不影响计算。') }}</p>
    <div class="plans"><fieldset v-for="id in ['a','b']" :key="id" :class="id"><legend>{{ id.toUpperCase() }} <span>{{ t('Plan','方案') }}</span></legend>
      <label class="method-field" :for="`${id}-method`">{{ t('Repayment method','还款方式') }}<select :id="`${id}-method`" v-model="input[id].method"><option value="payment">{{ method('payment') }}</option><option value="principal">{{ method('principal') }}</option></select></label>
      <label :for="`${id}-rate`">{{ t('Annual rate · %','年利率 · %') }}<input :id="`${id}-rate`" v-model.number="input[id].rate" type="number" min="0" max="20" step="0.1" :aria-invalid="!!invalid[id+'-rate']" :aria-describedby="id+'-help'"/></label>
      <label :for="`${id}-months`">{{ t('Term · months','期限 · 月') }}<input :id="`${id}-months`" v-model.number="input[id].months" type="number" min="1" max="600" step="1" :aria-invalid="!!invalid[id+'-months']" :aria-describedby="id+'-help'"/></label>
      <p :id="id+'-help'" :class="{error:invalid[id+'-rate'] || invalid[id+'-months']}">{{ t('Rate: 0–20%. Term: 1–600 whole months (up to 50 years).','年利率 0–20%；期限 1–600 整数月（最长 50 年）。') }}</p>
    </fieldset></div>
  </fieldset>
  <p v-if="Object.keys(invalid).length" class="error" role="alert">{{ t('Invalid input. Showing the last valid results; correct the marked fields.','输入无效。下方保留上次有效结果，请修正标记字段。') }}</p>
  <fieldset class="timeline" :disabled="!ready"><legend>{{ t('View a month','查看月份') }}</legend><div class="date-field"><span>{{ t('Repayment month','还款月份') }}</span><MonthPicker id="view-month" v-model="viewedDate" :lang="lang" :label="t('Repayment month','还款月份')" :disabled="!ready" :min="calendarMonth(calendarStart,0)" :max="calendarMonth(calendarStart,result.months)" :aria-invalid="monthInvalid" aria-describedby="month-help"/></div><p id="month-help" :class="{error:monthInvalid}">{{ monthInvalid ? t(`Choose a month from ${calendarMonth(calendarStart,0)} to ${calendarMonth(calendarStart,result.months)}.`, `请选择 ${calendarMonth(calendarStart,0)} 至 ${calendarMonth(calendarStart,result.months)} 之间的月份。`) : t(`Period ${month}. Choose a month or click any chart; all views update together.`, `第 ${month} 期。选择月份或点击任一图表，所有视图同步更新。`) }}</p></fieldset>
  <section v-for="(chart,index) in charts" :key="chart.id" class="chart" :aria-labelledby="chart.id+'-heading'">
    <div class="chart-head"><h2 :id="chart.id+'-heading'">{{ chart.title }} <small>{{ currency }}</small></h2>
      <div class="view-actions"><label :for="chart.id+'-mode'">{{ t('View','视图') }} {{ index+1 }}<select :id="chart.id+'-mode'" v-model="views[index].mode" :disabled="!ready"><option v-for="option in viewOptions" :key="option.key" :value="option.key">{{ option.option || option.title }}</option></select></label><button class="remove-view" :disabled="!ready || views.length===1" :aria-label="t(`Remove view ${index+1}`, `移除视图 ${index+1}`)" @click="removeView(chart.id)">{{ t('Remove','移除') }}</button></div>
    </div>
    <div class="legend"><span v-for="(s,i) in chart.series" :key="s.label" :class="{b:i}">{{ i ? '┄' : '━' }} {{ s.label }}</span></div>
    <MortgageChart :id="chart.id" :title="chart.title" :description="summary(chart)" :series="chart.series" :month="month" :start="chart.start" :end="result.months" :markers="markers(chart)" :payoffs="payoff" :zh="zh" :calendar-start="calendarStart" @select="month = $event"/>
    <p class="readout sr-only">{{ t('Month','月份') }} {{ month }} · A: {{ money(selected.a[chart.metric]) }} · B: {{ money(selected.b[chart.metric]) }} · A − B: {{ money(selected.a[chart.metric]-selected.b[chart.metric]) }}</p>
  </section>
  <div class="view-manager"><button id="add-view" :disabled="!ready || views.length>=maxViews" @click="addView">{{ t('Add view','添加视图') }}</button><span class="muted">{{ views.length }} / {{ maxViews }} · {{ views.length>=maxViews ? t('Maximum 6 views.','最多 6 个视图。') : t('Each view can show any metric.','每个视图都可自由选择指标。') }}</span></div>
  <section class="totals"><div v-for="id in ['a','b']" :key="id"><span>{{ id.toUpperCase() }} {{ t('total interest','总利息') }}</span><strong>{{ money(result.rows.at(-1)[id].cumulative) }} <small>{{ currency }}</small></strong></div></section>
  <section class="explanation"><h2>{{ t('Current comparison · Local calculation summary','当前比较 · 本地计算总结') }}</h2><p class="muted">{{ t('Deterministic summary. No AI service is connected.','确定性指标总结，未连接 AI 服务。') }}</p><p>{{ t('A − B is always the difference: a positive value means A is higher. A payment crossing only reverses the payment ranking; it does not establish which loan is best overall.','差额始终为 A − B：正值表示 A 更高。月供交点只表示月供高低反转，不能判断整体最优方案。') }}</p><p>{{ t('At the selected month, cumulative interest A − B is','所选月份，累计利息差 A − B 为') }} <strong>{{ money(selected.a.cumulative-selected.b.cumulative) }} {{ currency }}</strong>{{ zh ? '。' : '. ' }}{{ t('Remaining principal','剩余本金') }} A {{ money(selected.a.balance) }} / B {{ money(selected.b.balance) }} {{ currency }}.</p><p>{{ t('Without fees: paid so far + remaining principal − original principal = interest paid. After payoff, payment and balance are zero; cumulative interest stays constant.','无费用时：累计还款 + 剩余本金 − 初始本金 = 累计利息。结清后月供和余额为零，累计利息保持不变。') }}</p></section>
  <details class="data"><summary>{{ t('Repayment data · all months','还款明细 · 全部月份') }}</summary><div class="fold-content"><p>{{ t('JPY, displayed to 2 decimals; calculations are not rounded monthly. Month 0 is the opening position.','单位日元，显示 2 位小数；计算不逐月舍入。第 0 月为初始状态。') }}</p><div class="paging"><button :disabled="!ready || page===0" @click="page--">{{ t('Previous','上一页') }}</button><span>{{ page+1 }} / {{ Math.floor(result.months/24)+1 }}</span><button :disabled="!ready || (page+1)*24>result.months" @click="page++">{{ t('Next','下一页') }}</button></div><div class="table-scroll" tabindex="0" :aria-label="t('Scrollable repayment table','可滚动还款表')"><table><caption>{{ t('Same schedule as the charts · 24 months per page','与图表共用还款表 · 每页 24 个月') }}</caption><thead><tr><th scope="col">{{ t('Month','月份') }}</th><template v-for="id in ['A','B']" :key="id"><th v-for="label in [t('Payment','月供'),t('Principal','当期本金'),t('Interest','当期利息'),t('Cumulative interest','累计利息'),t('Balance','余额'),t('Paid to date','累计还款')]" :key="label" scope="col">{{ id }} {{ label }}</th></template></tr></thead><tbody><tr v-for="row in tableRows" :key="row.month" :class="{chosen:row.month===month}"><th scope="row">{{ row.month }} · {{ calendarMonth(calendarStart,row.month) }}</th><template v-for="id in ['a','b']" :key="id"><td v-for="key in ['payment','principal','interest','cumulative','balance','paid']" :key="key">{{ money(row[id][key]) }}</td></template></tr></tbody></table></div><noscript>{{ t('Enable JavaScript to page through all months.','启用 JavaScript 后可翻页查看所有月份。') }}</noscript></div></details>
  <details><summary>{{ t('Concepts','基本概念') }}</summary><div class="fold-content"><p>{{ t('Equal payment keeps principal plus interest constant. Equal principal repays a constant share of principal, so payments decrease at a positive fixed rate. Interest is charged on the opening balance each month.','元利均等保持本金加利息的月供稳定；元金均等每期归还相同本金，正固定利率下月供递减。每期利息按期初余额计算。') }}</p><a href="https://www.jhf.go.jp/files/topics/3092_ext_99_0.pdf">{{ t('Japan Housing Finance Agency: repayment methods','住宅金融支援机构：还款方式说明') }}</a></div></details>
  <details class="formulas"><summary>{{ t('Formulas and assumptions','公式与计算假设') }}</summary><div class="fold-content">
    <h3>{{ t('Symbols','符号说明') }}</h3>
    <dl class="symbols">
      <div><dt>P</dt><dd>{{ t('Original principal (JPY).','初始借款本金（日元）。') }}</dd></div>
      <div><dt>a</dt><dd>{{ t('Nominal annual interest rate, e.g. 1.5%.','名义年利率，例如 1.5%。') }}</dd></div>
      <div><dt>r</dt><dd>{{ t('Monthly interest rate: r = a ÷ 12. For example, 1.5% ÷ 12 = 0.125% (= 0.00125).','月利率：r = a ÷ 12。例如 1.5% ÷ 12 = 0.125%（即 0.00125）。') }}</dd></div>
      <div><dt>n</dt><dd>{{ t('Total number of monthly payments.','总还款期数。') }}</dd></div>
      <div><dt>m</dt><dd>{{ t('Current payment number, from 1 to n.','当前期数，从 1 到 n。') }}</dd></div>
      <div><dt>M</dt><dd>{{ t('Fixed monthly payment for equal payment (JPY).','元利均等的固定月供（日元）。') }}</dd></div>
      <div><dt>M<sub>m</sub></dt><dd>{{ t('Payment in month m, including principal and interest (JPY).','第 m 期月供，包含本金和利息（日元）。') }}</dd></div>
      <div><dt>I<sub>m</sub></dt><dd>{{ t('Interest paid in month m (JPY).','第 m 期支付的利息（日元）。') }}</dd></div>
      <div><dt>C<sub>m</sub></dt><dd>{{ t('Principal repaid in month m (JPY).','第 m 期归还的本金（日元）。') }}</dd></div>
      <div><dt>B<sub>m</sub></dt><dd>{{ t('Principal balance after payment m. B₀ = P; Bₘ₋₁ is the opening balance for month m.','第 m 期还款后的剩余本金。B₀ = P；Bₘ₋₁ 是第 m 期还款前的本金余额。') }}</dd></div>
    </dl>
    <h3>{{ t('Monthly payments','两种方式的月供') }}</h3>
    <p><strong>{{ t('Equal payment (r > 0)','元利均等（r > 0）') }}</strong></p>
    <p class="equation">M = P × r ÷ [1 − (1 + r)<sup>−n</sup>]<br/>M<sub>m</sub> = M</p>
    <p><strong>{{ t('Equal principal','元金均等') }}</strong></p>
    <p class="equation">M<sub>m</sub> = P ÷ n + [P − P × (m − 1) ÷ n] × r</p>
    <p>{{ t('At zero interest, both methods have Mₘ = P ÷ n and Iₘ = 0.','零利率时，两种方式均为 Mₘ = P ÷ n，Iₘ = 0。') }}</p>
    <h3>{{ t('Interest, principal and balance each month','每期利息、本金与余额') }}</h3>
    <div class="equations"><p class="equation">I<sub>m</sub> = B<sub>m−1</sub> × r</p><p class="equation">C<sub>m</sub> = M<sub>m</sub> − I<sub>m</sub></p><p class="equation">B<sub>m</sub> = B<sub>m−1</sub> − C<sub>m</sub></p></div>
    <p>{{ t('Cumulative interest through month m is I₁ + I₂ + … + Iₘ; total interest uses m = n.','截至第 m 期的累计利息为 I₁ + I₂ + … + Iₘ；全期总利息取 m = n。') }}</p>
    <h3>{{ t('Model assumptions and display precision','模型假设与显示精度') }}</h3>
    <ul><li>{{ t('Fixed nominal annual rate, monthly payments at the end of each period. No fees, taxes, prepayment or variable rates.','固定名义年利率，每月期末还款；不含手续费等额外费用、税收、提前还款及变动利率。') }}</li><li>{{ t('Calculations retain floating-point precision without bank-specific monthly rounding. The final payment clears the remaining principal; its amount may differ slightly from the ideal fixed payment.','计算保留浮点精度，不采用银行逐期舍入规则。末期归还剩余本金，因此末期金额可能与理论固定月供存在微小差异。') }}</li><li>{{ t('Charts show whole JPY; tables show two decimal places. Display rounding does not change the calculation.','图表金额取整，表格保留两位小数；显示舍入不改变计算结果。') }}</li><li>{{ t('Equality tolerance is 0.00001 JPY. Crossings use straight-line interpolation between monthly samples; the interpolated month is not an actual repayment date.','相等判断容差为 0.00001 日元。交点采用月度样本间的直线插值，插值月份并非实际还款日期。') }}</li></ul>
  </div></details>
  <details><summary>{{ t('Rate references and variable-rate boundaries','利率资料与变动利率边界') }}</summary><div class="fold-content"><p>{{ t('References checked 2026-09-05. Policy rates, prime rates and an actual mortgage offer are different. No live rates are fetched or inserted into this tool.','资料核验于 2026-09-05。政策利率、最优惠贷款利率和房贷实际适用利率不同。本工具不自动抓取或代入即时利率。') }}</p><ul><li><a href="https://www.boj.or.jp/statistics/dl/loan/prime/prime.htm">{{ t('Bank of Japan: prime-rate series','日本银行：长短期最优惠贷款利率') }}</a></li><li><a href="https://www.sumai-info.com/loan-knowledge/kinri.html">{{ t('Housing Finance Promotion Association: mortgage rates','住宅金融普及协会：房贷利率资料') }}</a></li><li><a href="https://www.bk.mufg.jp/info/hendoukinri2.html">{{ t('MUFG: variable-rate explanation','MUFG：变动利率说明') }}</a></li><li><a href="https://homeloan.bk.mufg.jp/kiyaku/_PDF/super_jutaku_loan_maitsuki.pdf">{{ t('MUFG: product rules and deferred interest','MUFG：产品规则及递延未付利息') }}</a></li><li><a href="https://faq01.bk.mufg.jp/faq/show/6915?site_domain=default">{{ t('MUFG: missed-payment FAQ','MUFG：未按期还款 FAQ') }}</a></li></ul><p>{{ t('Five-year and 125% payment rules depend on the bank and contract. They do not cap the interest rate. Deferred unpaid interest is not automatically delinquency; this tool models neither such rules nor penalties.','5 年和 125% 月供调整规则依银行及合同而定，并非利率上限。递延未付利息不自动等于逾期；本工具不模拟这些规则或罚息。') }}</p></div></details>
</div>
</template>
<style scoped>
.mortgage{color-scheme:light;background:#f7f4ed;color:#20231f;font:16px/1.6 system-ui,sans-serif;width:100%;padding:24px;box-sizing:border-box}.mortgage *{box-sizing:border-box}.mortgage a{color:#99301f}.mortgage.chinese .mortgage h1{font:clamp(32px,4vw,52px)/1.25 Georgia,'Songti SC',serif;margin:28px 0 12px}.intro{font-size:20px;margin-bottom:4px}.muted,.mortgage small{color:#64665f}.mortgage h2{font:24px/1.35 Georgia,'Songti SC',serif;border:0;margin:0}.mortgage small{font:14px system-ui}.mortgage fieldset{border:1px solid #aaa497;margin:0;min-width:0;padding:16px}.mortgage .controls{border:0;padding:16px 0}.mortgage label{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:8px 0}.mortgage input,.mortgage select,.mortgage button{min-height:44px;border:1px solid #77786c;background:#fffcf6;color:#20231f;border-radius:3px;font:inherit;padding:8px 12px;max-width:100%;min-width:0}.mortgage input[type=number]{width:160px}.amount-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.mortgage .amount{flex:0 1 auto;justify-content:flex-start;font-weight:650;font-size:19px;gap:16px}.mortgage .amount input{font-size:20px;font-weight:500}.magnitude{color:#64665f;font-size:14px}.mortgage .amount input{width:240px}.plans{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:24px}.plans legend{font-size:22px;color:#b63824;padding:0 8px}.plans .b legend{color:#6d681e}.plans p,#amount-help,.timeline p{font-size:14px;margin:8px 0}.paging{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:16px}.mortgage button{cursor:pointer;color:#99301f}.mortgage button:hover{background:#eee6d9}.mortgage :disabled{cursor:default;opacity:.65}.mortgage :focus-visible{outline:2px solid #99301f;outline-offset:3px}.mortgage .error{color:#8b241c;font-weight:600}.mortgage [aria-invalid=true]{border:2px solid #8b241c}.mortgage .timeline{margin:20px 0;border-color:#aaa497}.timeline label{justify-content:flex-start}.timeline output{font-weight:700}.chart{border-top:1px solid #cbc7bd;padding:24px 0 16px}.chart-head{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}.chart-head label{font-size:14px}.legend{display:flex;justify-content:flex-end;gap:20px;flex-wrap:wrap;color:#b63824;font-size:14px;margin:8px 0}.legend .b{color:#6d681e}.readout{font-variant-numeric:tabular-nums;font-size:14px}.totals{display:grid;grid-template-columns:1fr 1fr;gap:24px;border-block:1px solid #cbc7bd;padding:24px 0}.totals strong{display:block;font-size:24px;color:#b63824}.totals>div+div strong{color:#6d681e}.explanation{padding:28px 0}.mortgage details{border-top:1px solid #cbc7bd;padding:12px 0}.mortgage summary{cursor:pointer;min-height:44px;align-content:center}.table-scroll{max-width:100%;overflow:auto;margin-top:16px}.mortgage table{display:table;white-space:nowrap;width:100%;font-size:14px;margin:0}.mortgage td,.mortgage th{padding:8px;border:1px solid #cbc7bd;background:#f7f4ed;text-align:right}.mortgage .chosen td,.mortgage .chosen th{background:#efe0c8}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}@media(max-width:700px){.mortgage{padding:12px}.plans,.totals{grid-template-columns:1fr;gap:12px}.mortgage label{flex-wrap:wrap}.plans label{display:block}.plans select,.plans input[type=number]{width:100%;margin-top:4px}.mortgage h2{font-size:23px}.legend{justify-content:flex-start;gap:8px}.chart{padding:20px 0}.totals strong{font-size:22px}.mortgage .amount{display:flex;flex-wrap:wrap}.mortgage .amount input{width:200px;margin-top:0}}@media(prefers-reduced-motion:reduce){.mortgage *{transition:none!important;scroll-behavior:auto!important}}
.calendar-start{justify-content:flex-start!important;flex-wrap:wrap;font-weight:550}.calendar-help{font-size:13px;color:#64665f;margin:4px 0 20px}.plans label{font-weight:550}.plans input,.plans select{font-weight:400}.timeline legend{font-weight:600}
.formulas h3{font-size:18px;line-height:1.5;margin:28px 0 12px}.formulas p{margin:12px 0}.formulas .equation{font:16px/1.9 ui-monospace,monospace;overflow-wrap:anywhere;background:#eee9df;padding:12px 16px;border-radius:3px}.symbols{margin:16px 0}.symbols>div{display:grid;grid-template-columns:80px 1fr;gap:12px;border-bottom:1px solid #cbc7bd;padding:10px 0}.symbols dt{font-weight:650}.symbols dd{margin:0}.formulas li{margin:10px 0}.formulas sub,.formulas sup{font-size:.75em}@media(max-width:480px){.symbols>div{grid-template-columns:64px 1fr}.formulas .equation{padding:10px;font-size:14px}}
.view-actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap;min-width:0}.view-actions label{min-width:0;flex-wrap:wrap}.view-actions select{max-width:100%}.view-manager{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:8px 0 24px}.view-manager span{font-size:14px}.mortgage h2,.mortgage h3{padding-top:0}.fold-content{display:flow-root;margin:8px 0 12px 16px;padding-left:12px;border-left:2px solid #ddd7cc}.fold-content>:first-child{margin-top:0}.mortgage .formulas h3{border-top:1px solid #ddd7cc;padding-top:16px;margin-top:24px}.mortgage .formulas .fold-content>h3:first-child{border:0;padding:0;margin:0 0 12px}.mortgage .formulas h3+p{margin-top:12px}@media(max-width:480px){.fold-content{margin-left:8px;padding-left:10px}.view-actions{width:100%}.view-actions label{flex:1}.view-actions select{width:100%}}
.date-field{display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin:8px 0}.mortgage .plans .method-field{display:flex;flex-direction:column;align-items:stretch;gap:6px}.mortgage .plans .method-field select{width:100%;flex-shrink:0;padding-right:28px}.date-field>span{font-weight:550}@media(max-width:480px){.date-field{align-items:flex-start;flex-direction:column}}
@media(max-width:480px){.mortgage.chinese .plans .method-field select{font-size:14px}}
.mortgage[lang="en"] .plans .method-field{align-items:flex-start}.mortgage[lang="en"] .plans .method-field select{width:160px}@media(max-width:700px){.mortgage[lang="en"] .plans .method-field select{width:100%}}
/* The theme owns layout; this page class scopes its supported width variable. */
:global(.vp-theme-container.mortgage-page){--content-width:1200px}
.mortgage>.explanation,.mortgage>details{max-width:800px}
@media(min-width:960px){.mortgage .plans .method-field,.mortgage[lang="en"] .plans .method-field{flex-direction:row;align-items:center;justify-content:space-between;flex-wrap:nowrap}.mortgage .plans .method-field select{width:280px}.mortgage[lang="en"] .plans .method-field select{width:160px}}
.mortgage[lang="en"] .plans .method-field select{width:200px;max-width:100%}.view-actions label{flex:0 1 auto}.view-actions select{width:max-content;max-width:100%}@media(max-width:700px){.mortgage[lang="en"] .plans .method-field select{width:100%}}@media(max-width:480px){.view-actions label{flex:0 0 100%}.view-actions select{width:100%;font-size:14px}}
.mortgage[lang="en"] .plans input[type="number"]{width:200px}@media(max-width:700px){.mortgage[lang="en"] .plans input[type="number"]{width:100%}}
.mortgage.chinese .view-actions select{width:220px;max-width:100%}
@media(max-width:480px){.mortgage.chinese .view-actions select{width:100%}}
</style>

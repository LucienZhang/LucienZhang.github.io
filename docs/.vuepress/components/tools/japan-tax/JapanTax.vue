<script setup>
import { computed, nextTick, reactive, ref } from 'vue';
import { estimateSettlement } from './settlement.mjs';
import { yen, calculate, calculateResident, estimateFurusatoLimit } from './tax-calculation.mjs';
import { formatAmount } from './amount-format.js';
import AmountField from './AmountField.vue';
import HelpPopover from './HelpPopover.vue';
import { source, primaryFields, totalField, residentTotalField, adjustmentField, housingAmountField, deductionFields, resultFields } from './fields.js';
const props = defineProps({ locale: { type: String, default: 'en' } });
const zh = computed(() => props.locale === 'zh');
const copy = (cn, en) => zh.value ? cn : en;
const values = reactive({ salary: '', withheld: '', total: '', residentTotal: '', adjustment: '', furusato: '' });
const mode = ref('total');
const selected = ref('');
const items = ref([]);
const procedure = ref('');
const incomeAdjustment = ref(false);
const emptyHousing = () => ({ enabled: false, amount: '', eligible: false, incomeLimit: '', residentBand: '', stage: '' });
const housing = reactive(emptyHousing());
const announcement = ref('');
const available = computed(() => deductionFields.filter(f => !items.value.includes(f.id)));
const activeItems = computed(() => items.value.map(id => deductionFields.find(f => f.id === id)));
const furusatoField = { id: 'furusato', jp: '寄附金額', zh: '实际捐款额', en: 'Amount donated',
  zhHelp: '填写2025年ふるさと納税实际捐款合计，包含自付部分，不要自行减去2,000日元；无捐款填0。',
  enHelp: 'Enter total actual furusato donations made in 2025, including the out-of-pocket portion. Do not subtract ¥2,000 yourself; enter 0 for no donations.',
  zhWhere: '查寄附金受領証明書或寄附金控除に関する証明書。源泉徴収票没有独立的ふるさと納税捐款栏。',
  enWhere: 'Use donation receipts or a donation deduction certificate. The withholding slip has no dedicated furusato donation box.', source: source.furusato };
async function addItem() { if (!selected.value) return; const id = selected.value; items.value.push(id); values[id] = ''; values['resident-' + id] = ''; selected.value = ''; await nextTick(); document.getElementById(`tax-${id}`)?.focus(); }
async function removeItem(id) { items.value = items.value.filter(item => item !== id); delete values[id]; delete values['resident-' + id]; await nextTick(); document.getElementById('deduction-select')?.focus(); }
function clear() { Object.keys(values).forEach(key => values[key] = ''); items.value = []; selected.value = ''; mode.value = 'total'; procedure.value = ''; incomeAdjustment.value = false; Object.assign(housing, emptyHousing()); announcement.value = copy('全部输入已清空。', 'All inputs cleared.'); }
const sourceGroups = [
  { zh: '票据与扣除', en: 'Records & deductions', links: [
    ['form', '国税厅：源泉徴収票字段', 'NTA: withholding-slip fields'],
    ['deductions', '国税厅：所得控除种类', 'NTA: income deductions'],
    ['residentDeductions', '横浜市：2026 年度住民税所得控除', 'Yokohama: 2026 resident deductions'],
  ] },
  { zh: '所得与税额', en: 'Income & tax', links: [
    ['income', '国税厅：給与所得控除', 'NTA: employment-income deduction'],
    ['incomeAdjustment', '国税厅：所得金額調整控除', 'NTA: employment-income adjustment'],
    ['housingSlip', '国税厅：房贷控除票据栏', 'NTA: housing-credit slip fields'],
    ['residentHousing', '西东京市：房贷控除结转', 'Nishitokyo: resident housing credit'],
    ['salaryTable', '国税厅：2025 年給与所得精确表', 'NTA: exact 2025 employment-income table'],
    ['rate', '国税厅：所得税率与千元舍入', 'NTA: income-tax rates and rounding'],
    ['reconstruction', '国税厅：復興特別所得税', 'NTA: reconstruction surtax'],
    ['residentRates', '中野区：住民税标准税率与算例', 'Nakano: resident-tax rates and example'],
    ['adjustment', '京都市：調整控除', 'Kyoto: adjustment credit'],
  ] },
  { zh: '故乡税、退税与征收', en: 'Donations, refunds & collection', links: [
    ['furusato', '国税厅：ふるさと納税与申报方式', 'NTA: furusato nozei and claims'],
    ['residentDonation', '京都市：寄附金税額控除与适用比例', 'Kyoto: donation credits and rates'],
    ['refund', '国税厅：還付申告', 'NTA: refund returns'],
    ['settlement', '国税厅：退税与补缴舍入', 'NTA: refund and payment rounding'],
    ['donationRounding', '葛饰区：舍入示例（旧年度 PDF）', 'Katsushika: rounding example (historical PDF)'],
    ['annualRounding', '中野区：所得割百元截尾', 'Nakano: income-levy rounding'],
    ['monthlyRounding', '美浜町：月度分配与6月余数', 'Mihama: monthly allocation and June remainder'],
    ['smallAnnual', '北见市：小额年税首月征收', 'Kitami: small annual bills collected in June'],
    ['resident', '新宿区：工资特别征收周期', 'Shinjuku: payroll collection schedule'],
  ] },
];
const months = [6, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5];
const calculation = computed(() => calculate({ salary: values.salary, incomeAdjustment: incomeAdjustment.value, housing, deductions: mode.value === 'total' ? [values.total] : items.value.map(id => values[id]) }));
const hasOtherDonations = computed(() => mode.value === 'items' && items.value.includes('donation') && (yen(values.donation) ?? 0n) > 0n);
const residentCalculation = computed(() => calculateResident({ salary: values.salary, incomeAdjustment: incomeAdjustment.value, deductions: mode.value === 'total' ? [values.residentTotal] : items.value.map(id => id === 'donation' ? '0' : values['resident-' + id]), adjustment: values.adjustment }));
const settlement = computed(() => estimateSettlement({ national: calculation.value, resident: residentCalculation.value,
  salary: values.salary, withheld: values.withheld, donation: values.furusato, method: procedure.value, hasOtherDonations: hasOtherDonations.value, housing }));
const finalNational = computed(() => settlement.value.national);
const finalResident = computed(() => settlement.value.resident);
const money = value => value == null ? '—' : formatAmount(String(value));
const owesTax = computed(() => finalNational.value.status === 'ready' && finalNational.value.due > 0n);
const settlementMessage = status => ({
  housingConditions: copy('请完成房贷适用制度及资格确认。', 'Complete the housing regime and eligibility fields.'),
  housingAmount: copy('请填写有效的当年房贷控除可能額（100日元整数倍）。', 'Enter an annual housing credit entitlement in multiples of ¥100.'),
  housingFirstReturn: copy('首次申报房贷控除须选择確定申告，不能使用one-stop。', 'A first housing-credit claim requires a tax return; one-stop is unavailable.'),
  otherDonations: copy('其他捐款的合并抵扣尚未覆盖，暂不提供此项估算。', 'Combined relief for other donations is not supported; this estimate is unavailable.'),
  inputs: copy('请补全上方收入与扣除。', 'Complete income and deductions above.'),
  donation: copy('请填写捐款额；未捐款填 0。', 'Enter donations; use 0 for none.'),
  method: copy('请选择申请方式。', 'Choose a claim method.'),
  withheld: copy('请填写源泉徴収税額；未预扣填 0。', 'Enter tax withheld; use 0 for none.'),
  oneStopIneligible: copy('工资收入超过 2,000 万日元，不适用ワンストップ；请选择確定申告。', 'Salary exceeds ¥20 million; choose a tax return instead of one-stop.'),
  exemption: copy('课税所得为 0，需另行判断均等割与非课税资格，暂不估算。', 'With zero taxable income, flat-tax and exemption eligibility need review; no estimate is shown.'),
  rate: copy('所得税率为 0 时的故乡税抵扣尚未覆盖，暂不估算。', 'Furusato relief with a zero income-tax rate is outside this estimate.'),
}[status] ?? '');
const furusatoEstimate = computed(() => hasOtherDonations.value ? { status: 'otherDonations' } : estimateFurusatoLimit(calculation.value, residentCalculation.value));
const furusatoLimitValue = computed(() => furusatoEstimate.value.amount == null ? '—' : formatAmount(String(furusatoEstimate.value.amount)));
const residentValue = id => residentCalculation.value[id] == null ? '—' : formatAmount(String(residentCalculation.value[id]));
const itemField = (field, resident) => ({ ...field, id: resident ? 'resident-' + field.id : field.id, jp: field.jp + (resident ? '（住民税用）' : '（所得税用）'), ...(resident ? { zhHelp: '按住民税规则填写扣除额，不适用填0。' + field.zhHelp, enHelp: 'Use resident-tax rules; enter 0 if inapplicable. ' + field.enHelp, source: residentTotalField.source } : {}) });
const resultValue = id => calculation.value[id] == null ? '—' : formatAmount(String(calculation.value[id]));
const calculationStatus = computed(() => {
  switch (calculation.value.status) {
    case 'housingConditions': case 'housingAmount': return settlementMessage(calculation.value.status);
    case 'deductions': return copy('请填写有效的扣除合计或全部已选明细；无扣除请在合计填 0。', 'Enter a valid deduction total or complete every selected item; enter total 0 for no deductions.');
    case 'range': return copy('給与所得超过 3.3 亿日元，暂不支持高额所得特别规则。', 'Employment income exceeds ¥330 million; the special high-income rules are not supported.');
    default: return copy('请填写有效的工资收入（日元整数，最多 16 位）。', 'Enter valid gross salary (whole yen, up to 16 digits).');
  }
});

</script>

<template>
  <div class="tax-shell" :lang="zh ? 'zh-CN' : 'en'">
    <div class="tax-content">
      <section class="hero"><h1> {{ copy('日本税务计算器', 'Japan tax calculator') }}</h1><p class="intro">{{ copy('从源泉徴収票出发，看清所得、退税与来年住民税。', 'From your withholding slip to income, refunds and next year’s resident tax.') }}</p><p class="preview-note">{{ copy('规则核对：2026-09-06', 'Rules checked: 2026-09-06') }}</p></section>
      <details class="slip-guide"><summary>{{ copy('源泉徴収票：这几个金额在哪里？', 'Where are these amounts on the withholding slip?') }}</summary><p>{{ copy('对照票据上部金额栏的日文原名。以下为字段对应示意，非正式票据；布局以雇主提供的票据为准。', 'Match the Japanese labels in the upper amount row. This is a simplified field map, not an official slip; your employer’s layout may vary.') }}</p><div class="slip-map" lang="ja"><div><small>③ · {{ copy('输入', 'Input') }}</small>支払金額</div><div><small>④ · {{ copy('结果核对', 'Result reference') }}</small>給与所得控除後の金額<br>（調整控除後）</div><div><small>⑤ · {{ copy('输入', 'Input') }}</small>所得控除の額の合計額</div><div><small>⑥ · {{ copy('输入', 'Input') }}</small>源泉徴収税額</div></div><a :href="source.form" target="_blank" rel="noopener noreferrer">{{ copy('打开国税厅令和7年分票据样式与字段说明 ↗', 'Open the NTA 2025 slip and field guide (Japanese) ↗') }}</a><p class="small">{{ copy('本版适用 2025 年收入。医疗费、寄附金等扣除并非都在票中列出。无需上传票据。', 'This version applies to 2025 income. Medical and donation deductions are not all shown on the slip. No document upload is needed.') }}</p></details>
      <div class="calculator">
        <section class="inputs" aria-labelledby="inputs-title"><div class="section-heading"><h2 id="inputs-title">{{ copy('输入条件', 'Your inputs') }}</h2><span>{{ copy('金额单位：日元', 'Amounts in JPY') }}</span></div>
          <AmountField v-for="field in primaryFields" :key="field.id" :field="field" :zh="zh" v-model="values[field.id]" />
          <section class="deduction-group" aria-labelledby="deduction-group-title"><h3 id="deduction-group-title">{{ copy('扣除与抵税', 'Deductions & tax credits') }}</h3>
          <div class="credit-option">
            <div class="help-heading"><label class="inline-check"><input id="income-adjustment" v-model="incomeAdjustment" type="checkbox"><strong>{{ copy('适用 ', 'Apply ') }}<span lang="ja">所得金額調整控除</span></strong></label><HelpPopover id="income-adjustment-help" :label="copy('所得金额调整：适用条件', 'Income adjustment: eligibility')"><p>{{ copy('仅适用于居住者：有23岁未满的符合税法扶养条件的亲属，或本人为特别残障者，或生计同一配偶者/扶养亲属为特别残障者。亲属所得等资格须满足对应年度条件；16岁以下也可能适用。', 'For residents with a qualifying tax dependent under 23, a qualifying severe disability themselves, or a severely disabled qualifying spouse/dependent. Relative-income and other rules must match the tax year; under-16 dependents can qualify.') }}</p><p>{{ copy('工资超过850万时才扣减，最高15万，1日元进位。夫妻各自满足条件可各适用，不按子女人数倍增。先减給与所得，两套所得控除都不要再填此额。工资与公的年金并存的另一类调整未覆盖。', 'Applies only above ¥8.5m salary, capped at ¥150,000, rounded up to yen. Each eligible spouse may claim; not per child. Reduces employment income before both deduction totals. The separate salary-plus-public-pension adjustment is excluded.') }}</p><a :href="source.incomeAdjustment" target="_blank" rel="noopener noreferrer">{{ copy('国税厅：条件与公式 ↗', 'NTA: eligibility and formula ↗') }}</a></HelpPopover></div><p class="option-description">{{ copy('子女／特别残障条件适用时调整工资所得', 'Employment-income adjustment for qualifying child / disability conditions') }}</p>
          </div>
          <fieldset class="deductions"><legend>{{ copy('所得扣除', 'Income deductions') }}</legend><div class="mode-switch"><label><input type="radio" name="deduction-mode" value="total" v-model="mode">{{ copy('填写合计', 'Enter total') }}</label><label><input type="radio" name="deduction-mode" value="items" v-model="mode">{{ copy('逐项填写', 'Itemize') }}</label></div><p class="small">{{ copy('两套扣除均含基礎控除，不含ふるさと納税；故乡税在下方填写。', 'Include the basic allowance in both totals. Exclude furusato donations and enter them below.') }}</p>
            <div v-if="mode === 'total'"><AmountField :field="{ ...totalField, jp: totalField.jp + '（所得税用）' }" :zh="zh" v-model="values.total" /><AmountField :field="residentTotalField" :zh="zh" v-model="values.residentTotal" /></div>
            <div v-else class="item-editor"><p class="small">{{ copy('填写已确定的扣除额，不填保费或支出原额；不适用填 0。', 'Enter deduction amounts, not premiums or expenses paid; use 0 if inapplicable.') }}</p><div v-for="field in activeItems" :key="field.id" class="deduction-item"><AmountField :field="itemField(field, false)" :zh="zh" v-model="values[field.id]" /><AmountField v-if="field.id !== 'donation'" :field="itemField(field, true)" :zh="zh" v-model="values['resident-' + field.id]" /><p v-if="field.id === 'donation'" class="small">{{ copy('住民税的捐款减免属于税額控除，不计入所得控除；合并捐款的抵扣尚未覆盖。', 'Resident donation relief is a tax credit, not an income deduction. Combined donation relief is not yet supported.') }}</p><button class="remove" type="button" @click="removeItem(field.id)" :aria-label="copy('移除', 'Remove') + ' ' + field.jp">{{ copy('移除此项', 'Remove item') }}</button></div><label for="deduction-select">{{ copy('选择扣除条目', 'Choose a deduction') }}</label><div class="add-row"><select id="deduction-select" v-model="selected"><option value="">{{ copy('请选择', 'Select an item') }}</option><option v-for="field in available" :key="field.id" :value="field.id">{{ field.jp }} · {{ zh ? field.zh : field.en }}</option></select><button id="add-deduction" type="button" :disabled="!selected" @click="addItem">{{ copy('添加', 'Add') }}</button></div><a :href="source.deductions" target="_blank" rel="noopener noreferrer">{{ copy('国税厅：所得控除种类 ↗', 'NTA: types of income deduction ↗') }}</a></div>
          <details class="deduction-scope"><summary>{{ copy('所得扣除的适用条件', 'Income-deduction eligibility') }}</summary><p class="small">{{ copy('逐项填写仅合计已确定的所得扣除额，尚未自动判断各项年龄、家庭等资格。所得门槛通常看合計所得金額，不是税前工资或課税所得。所得金額調整控除及房贷税額控除在独立位置填写，不加进此合计。', 'Itemization sums established deductions; individual age and family eligibility is not derived. Ceilings usually use total income, not gross salary or taxable income. Enter employment-income adjustments and housing tax credits separately, not in these totals.') }}</p><a :href="source.deductions" target="_blank" rel="noopener noreferrer">{{ copy('国税厅：所得控除 ↗', 'NTA: income deductions ↗') }}</a></details>
          </fieldset>

          <fieldset class="tax-credits"><legend>{{ copy('税额抵扣', 'Tax credits') }}</legend><p class="small">{{ copy('直接抵税，不计入上方所得扣除合计。', 'Reduce tax directly; exclude these from the income-deduction totals above.') }}</p>
          <section class="housing-input"><label class="check-label"><input id="housing-enabled" v-model="housing.enabled" type="checkbox"><span class="option-copy"><strong>{{ copy('适用 ', 'Apply ') }}<span lang="ja">住宅借入金等特別控除</span></strong><small>{{ copy('房贷抵税', 'Housing-loan tax credit') }}</small></span></label>
            <div v-if="housing.enabled">
              <AmountField :field="housingAmountField" :zh="zh" v-model="housing.amount" />
              <label for="housing-income-limit">{{ copy('适用制度的本人合計所得上限', 'Total-income ceiling for your housing regime') }}</label><select id="housing-income-limit" v-model="housing.incomeLimit"><option value="">{{ copy('按入住年度及证明选择', 'Select using move-in year and certificate') }}</option><option value="20000000">{{ copy('2,000万日元 · 2022年起一般制度', '¥20m · ordinary regime from 2022') }}</option><option value="30000000">{{ copy('3,000万日元 · 旧制度／适用过渡措施', '¥30m · older regime / qualifying transition') }}</option><option value="10000000">{{ copy('1,000万日元 · 适用小面积住房特例', '¥10m · qualifying small-floor-area exception') }}</option></select>
              <div class="help-heading"><label for="housing-resident-band">{{ copy('住民税结转制度', 'Resident-tax carryover regime') }}</label><HelpPopover id="housing-regime-help" :label="copy('房贷结转制度说明', 'Housing carryover rules')"><p>{{ copy('一般为所得税課税所得的5%，最高97,500日元；部分2014—2021年入住且适用8%/10%消费税的取得，以及符合合同期限的2022年过渡措施，可用7%、最高136,500日元。不是只凭入住年就适用7%。', 'Ordinarily 5% of income-tax taxable income, capped at ¥97,500. Certain 2014–2021 acquisitions subject to 8%/10% consumption tax, and qualifying 2022 contract transitions, use 7% capped at ¥136,500. Move-in year alone does not establish the enhanced regime.') }}</p><p>{{ copy('只有所得税未抵完的可用额才能结转，按两级税3:2分配；不是把可能額直接乘5%或7%。', 'Only unused income-tax entitlement carries over, split 3:2 between the two tax components. The 5%/7% applies to taxable income, not to the credit entitlement.') }}</p><a :href="source.residentHousing" target="_blank" rel="noopener noreferrer">{{ copy('西东京市：制度条件 ↗', 'Nishitokyo: regime eligibility ↗') }}</a></HelpPopover></div><select id="housing-resident-band" v-model="housing.residentBand"><option value="">{{ copy('请选择适用制度', 'Select the applicable regime') }}</option><option value="standard">5% · {{ copy('上限97,500日元', '¥97,500 cap') }}</option><option value="enhanced">7% · {{ copy('上限136,500日元（特例）', '¥136,500 cap (exception)') }}</option><option value="none">{{ copy('不适用住民税结转', 'No resident-tax carryover') }}</option></select>
              <label for="housing-stage">{{ copy('房贷控除申报阶段', 'Housing-credit claim stage') }}</label><select id="housing-stage" v-model="housing.stage"><option value="">{{ copy('请选择', 'Select') }}</option><option value="first">{{ copy('首次申报（须確定申告）', 'First claim (tax return required)') }}</option><option value="continuing">{{ copy('第二年起', 'Second year or later') }}</option></select>
              <label class="check-label"><input id="housing-eligible" v-model="housing.eligible" type="checkbox">{{ copy('已确认入住年度、房屋、贷款和剩余控除年限符合所选制度', 'I have confirmed move-in year, property, loan and remaining credit-term eligibility') }}</label><a :href="source.housing" target="_blank" rel="noopener noreferrer">{{ copy('国税厅：住房资格与计算明细 ↗', 'NTA: housing eligibility and worksheets ↗') }}</a>
              <p v-if="calculation.housingExcluded" class="small" role="status">{{ copy('本人合計所得超过所选上限，本年房贷控除按0计算。', 'Your total income exceeds the selected ceiling; housing relief is zero for this year.') }}</p>
            </div>
          </section>
          <AmountField :field="adjustmentField" :zh="zh" v-model="values.adjustment" />
          </fieldset>
          </section>
        </section>
        <section class="results" aria-labelledby="results-title"><div class="section-heading"><h2 id="results-title">{{ copy('所得与税额明细', 'Income & tax breakdown') }}</h2></div><p v-if="values.salary && calculation.status !== 'ready'" class="result-note" role="status">{{ calculationStatus }}</p><p class="small">{{ copy('以下为ふるさと納税扣除前的金额。', 'Amounts before furusato tax relief.') }}</p>

          <dl class="result-list"><div v-for="[id, jp, cn, en, cnHelp, enHelp, href] in resultFields.filter(([id]) => id === 'incomeAdjustmentAmount' ? incomeAdjustment : ['taxBeforeHousing', 'housingUsed'].includes(id) ? housing.enabled : true)" :key="id"><dt><div class="help-heading"><span lang="ja">{{ jp }}</span><HelpPopover :id="`result-${id}-help`" :label="jp + copy('：定义与依据', ': definition and source')"><p>{{ copy(cnHelp, enHelp) }}</p><a :href="href" target="_blank" rel="noopener noreferrer">{{ copy('国税厅原文 ↗', 'NTA guidance ↗') }}</a></HelpPopover></div><small>{{ copy(cn, en) }}</small></dt><dd :id="`result-${id}`">{{ resultValue(id) }} <small>{{ id === 'rate' ? '%' : 'JPY' }}</small></dd></div></dl>
          <section class="resident-intermediate"><div class="help-heading"><h3>{{ copy('住民税所得割明细', 'Resident income-levy breakdown') }}</h3><HelpPopover id="resident-scope-help" :label="copy('住民税：计算范围', 'Resident tax: scope')"><p>{{ copy('按一般标准税率：市区町村民税 6%＋都道府县民税 4%。仅适用于需缴纳所得割的工资所得者，不判断非课税资格或地方税率差异。', 'Uses ordinary rates: 6% municipal + 4% prefectural. For salary earners liable for the income levy; exemptions and local rate variations are not assessed.') }}</p><p>{{ copy('课税所得按住民税所得扣除计算，舍弃不满 1,000 日元部分；所得割額减去手填的調整控除。此处尚未减房贷及捐款等税额控除，也不含均等割和森林环境税。', 'Resident taxable income uses resident deductions and is rounded down to ¥1,000. The levy is reduced by your adjustment credit, before housing and donation credits, the per-capita levy and forest tax.') }}</p><a :href="source.adjustment" target="_blank" rel="noopener noreferrer">{{ copy('京都市：調整控除 ↗', 'Kyoto: adjustment credit ↗') }}</a></HelpPopover></div><p class="small">{{ copy('所得割 10% · 非全年应纳税额', '10% income levy · Not the annual tax bill') }}</p><p v-if="values.salary && residentCalculation.status !== 'ready'" class="small" role="status">{{ residentCalculation.status === 'adjustmentRange' ? copy('調整控除不可超过控除前所得割額；所得超过2,500万日元时请填0。', 'Adjustment cannot exceed the pre-credit levy; above ¥25 million income enter 0.') : copy('请补全住民税扣除与調整控除；无适用填 0。', 'Complete resident deductions and the adjustment credit; use 0 if inapplicable.') }}</p><dl class="result-list"><div v-for="[id, cn, en] in [['taxable', '住民税課税所得', 'Resident taxable income'], ['beforeCredit', '調整控除前の所得割額', 'Income levy before adjustment'], ['levy', '調整控除後の所得割額', 'Income levy after adjustment']]" :key="id"><dt>{{ copy(cn, en) }}</dt><dd :id="`resident-result-${id}`">{{ residentValue(id) }} <small>JPY</small></dd></div></dl></section>
          <details class="calculation-formulas"><summary>{{ copy('计算公式与舍入', 'Formulas & rounding') }}</summary><p>{{ copy('給与所得按 2025 年官方精确表计算；已减所选所得金额调整。課税所得 = max(給与所得 − 所得扣除, 0)，舍弃不满 1,000 日元的部分。', 'Employment income uses the exact 2025 table, after the selected income adjustment. Taxable income = max(employment income − deductions, 0), rounded down to whole ¥1,000.') }}</p><p>{{ copy('房贷控除前所得税 = 課税所得 × 边际税率 − 速算扣除额；减去实际房贷抵扣后最低为0。復興特別所得税 = 房贷抵扣后所得税 × 2.1%，舍弃不满 1 日元的部分。', 'Pre-housing income tax = taxable income × marginal rate − quick deduction; subtract the housing credit, floored at zero. Reconstruction surtax = post-housing income tax × 2.1%, rounded down to whole yen.') }}</p><p v-if="calculation.status === 'ready'">{{ copy('本次所得扣除合计', 'Deduction total used') }}: {{ resultValue('deductionTotal') }} JPY · {{ copy('速算扣除额', 'Quick deduction') }}: {{ resultValue('quickDeduction') }} JPY</p><a :href="source.salaryTable" target="_blank" rel="noopener noreferrer">{{ copy('2025 年給与所得精确表 ↗', 'Exact 2025 employment-income table ↗') }}</a></details>
        </section>
          <section id="furusato-limit" class="result-block"><p v-if="housing.enabled" class="small">{{ copy('房贷抵扣可能使故乡税减免无法全额利用；下列仍为特例控除20%限额概算，不保证实际自付2,000日元。', 'Housing relief can prevent full use of donation relief. This remains an estimate of the 20% special-credit limit, not a guarantee of ¥2,000 out of pocket.') }}</p><h3>ふるさと納税の寄附上限額（概算）</h3><p>{{ copy('自付额控制在 2,000 日元时的捐款上限估计', 'Estimated donation limit for a ¥2,000 out-of-pocket cost') }}</p><div id="furusato-limit-value" class="big-value">{{ furusatoLimitValue }} <small>JPY</small></div><p class="small">{{ copy('仅供估算，不保证自付额恰为 2,000 日元。', 'Estimate only; a ¥2,000 out-of-pocket cost is not guaranteed.') }}</p><p class="small" role="status">{{ furusatoEstimate.status === 'otherDonations' ? settlementMessage('otherDonations') : furusatoEstimate.status === 'ready' ? copy('采用税率 ', 'Rate used: ') + furusatoEstimate.rate + '%' : furusatoEstimate.status === 'noLevy' ? copy('所得割額为0，没有可用于本估算的所得割抵扣额度。', 'The income levy is zero; no income-levy relief is available for this estimate.') : furusatoEstimate.status === 'noIncomeTax' ? copy('所得税率为0时的减税分配尚未支持，本版不估算上限。', 'Relief allocation at a zero income-tax rate is not supported; no limit is estimated.') : copy('', '') }}</p><details class="limit-formula"><summary>{{ copy('上限公式与计算口径', 'Limit formula & required inputs') }}</summary><p>{{ copy('上限目安 = 调整控除后、其他税额控除前的住民税所得割額 × 20% ÷ (90% − 当前所得税边际税率（代用） × 1.021) + 2,000 日元。', 'Indicative limit = resident-tax income levy after adjustment credit and before other tax credits × 20% ÷ (90% − current income-tax marginal rate (proxy) × 1.021) + ¥2,000.') }}</p><p>{{ copy('采用当前所得税边际税率代用，向下取整到日元；实际适用税率可能不同，尤其在分档边界附近。尚未校验所得税 40% 与住民税 30% 的捐款额限制。', 'Uses the current income-tax marginal rate as a proxy, rounded down to whole yen. The actual rate may differ near bracket boundaries. The 40% income-tax and 30% resident-tax donation limits are not checked.') }}</p><a :href="source.residentDonation" target="_blank" rel="noopener noreferrer">{{ copy('京都市：寄附金税額控除与适用比例 ↗', 'Kyoto: donation credits and applicable rates ↗') }}</a></details><a :href="source.furusato" target="_blank" rel="noopener noreferrer">{{ copy('国税厅：ふるさと納税 ↗', 'NTA: furusato nozei ↗') }}</a></section>
          <section class="furusato-input" aria-labelledby="furusato-input-title"><h3 id="furusato-input-title">ふるさと納税</h3><AmountField :field="furusatoField" :zh="zh" v-model="values.furusato" />
          <div class="help-heading"><label for="filing-method">{{ copy('申请方式', 'Claim method') }}</label><HelpPopover id="filing-method-help" :label="copy('申请方式：减税去向与条件', 'Claim method: relief and eligibility')"><p>{{ copy('確定申告：减少所得税及復興特別所得税，并抵扣次年度住民税。ワンストップ特例：包括所得税相当部分在内，统一抵扣次年度住民税。', 'Tax return: relief through income tax, reconstruction surtax and next year’s resident tax. One-stop: all relief, including the income-tax equivalent, goes through next year’s resident tax.') }}</p><p>{{ copy('ワンストップ适用于无需確定申告且捐款对象不超过 5 个自治体等条件。之后若提交確定申告，须重新申报全部捐款。', 'One-stop requires no tax-return obligation and donations to no more than five municipalities, among other conditions. If you later file a tax return, include all donations again.') }}</p><a :href="source.furusato" target="_blank" rel="noopener noreferrer">{{ copy('国税厅：申报方法 ↗', 'NTA: claiming relief ↗') }}</a></HelpPopover></div><select id="filing-method" v-model="procedure"><option value="">{{ copy('请选择', 'Select a method') }}</option><option value="return">確定申告</option><option value="one-stop">ワンストップ特例</option></select><p class="small">{{ copy('未捐款填 0。', 'Enter 0 if you made no donations.') }}</p></section>
          <section class="refund" aria-labelledby="refund-title">
            <p lang="ja">{{ owesTax ? '納める税金' : '還付される税金' }}</p>
            <div class="help-heading"><h3 id="refund-title">{{ owesTax ? copy('预计补缴', 'Estimated payment due') : finalNational.kind === 'one-stop' ? copy('故乡税所得税退税', 'Furusato income-tax refund') : copy('预计退税', 'Estimated refund') }}</h3><HelpPopover id="refund-help" :label="copy('退税：计算口径', 'Refund: calculation basis')"><p>{{ copy('確定申告：源泉徴収税額减去捐款扣除后的所得税及復興特別所得税。退税保留到日元；需补缴时舍弃不满100日元部分。已计房贷控除，未计予定納税或其他税額控除。', 'Tax return: withholding minus income tax and surtax after the donation deduction. Refunds retain whole yen; payments due are rounded down to ¥100. Includes housing relief; advance payments and other credits are excluded.') }}</p><p>{{ copy('ワンストップ下故乡税所得税退税为0；若因其他扣除申报退税，需改选確定申告并申报全部捐款。', 'One-stop gives no income-tax refund for furusato. To claim a refund for other deductions, select a tax return and report all donations.') }}</p><a :href="source.settlement" target="_blank" rel="noopener noreferrer">{{ copy('国税厅：税款结算 ↗', 'NTA: tax settlement ↗') }}</a></HelpPopover></div>
            <div id="refund-value" class="big-value">{{ money(owesTax ? finalNational.due : finalNational.refund) }} <small>JPY</small></div>
            <p v-if="finalNational.status !== 'ready' && (values.withheld || values.furusato)" role="status">{{ settlementMessage(finalNational.status) }}</p>
            <p v-else-if="finalNational.status === 'ready' && finalNational.kind === 'one-stop'">{{ copy('ワンストップ：故乡税减免全部计入住民税。', 'One-stop: all furusato relief goes through resident tax.') }}</p>
            <details v-else-if="finalNational.status === 'ready'" class="settlement-details"><summary>{{ copy('查看结算明细', 'View settlement breakdown') }}</summary><dl class="resident-summary"><div v-for="[id, cn, en] in [['deduction','寄附金所得控除額','Donation income deduction'],['taxable','捐款扣除后的課税所得','Taxable income after donation'],['taxBeforeHousing','房贷抵扣前所得税','Income tax before housing credit'],['housingUsed','所得税实际房贷抵扣','Housing credit used'],['tax','所得税額','Income tax'],['reconstruction','復興特別所得税額','Reconstruction surtax'],['total','所得税等合计','Combined income taxes'],['relief','故乡税带来的所得税等减少额','Income-tax reduction from donation']]" :key="id"><dt>{{ copy(cn, en) }}</dt><dd>{{ money(finalNational[id]) }} JPY</dd></div><div><dt>源泉徴収税額</dt><dd>{{ money(values.withheld) }} JPY</dd></div></dl></details>
          </section>
          <section class="result-block" aria-labelledby="monthly-title"><div class="help-heading"><h3 id="monthly-title">{{ copy('来年的每月住民税（概算）', 'Next year’s monthly resident tax (estimate)') }}</h3><HelpPopover id="monthly-help" :label="copy('月度住民税：范围与舍入', 'Monthly resident tax: scope and rounding')"><p>{{ copy('仅适用于需缴所得割、均等割和森林环境税的工资所得者。按6%＋4%所得割及标准均等割4,000日元、森林环境税1,000日元计算，不判断非课税资格或地方加算。', 'For salary earners liable for the income levy, per-capita levy and forest tax. Uses 6% + 4% and standard fixed charges of ¥4,000 + ¥1,000, without exemption checks or local additions.') }}</p><p>{{ copy('所得割依次减去調整控除、房贷及故乡税抵扣后，两级税分别舍弃不满100日元部分。年税额分12期，余数并入6月；年税额不超过5,000日元时6月一次征收。已计适用房贷结转，未计其他税額控除。', 'After adjustment, housing and donation credits, each income levy is rounded down to ¥100. Divide the annual bill into 12 months, with the remainder in June; bills up to ¥5,000 are collected entirely in June. Includes eligible housing carryover; other credits are excluded.') }}</p><a :href="source.monthlyRounding" target="_blank" rel="noopener noreferrer">{{ copy('美浜町：月度分配 ↗', 'Mihama: monthly allocation ↗') }}</a></HelpPopover></div>
            <p class="small">{{ copy('2026 年 6 月—2027 年 5 月 · 含标准均等割与森林环境税', 'June 2026–May 2027 · Includes standard per-capita and forest taxes') }}</p>
            <p v-if="finalResident.status !== 'ready' && values.furusato" class="small" role="status">{{ settlementMessage(finalResident.status) }}</p>
            <dl class="resident-summary"><div v-for="[id, cn, en] in [['annual','年度合计','Annual total'],['june','6 月','June'],['monthly','7 月至翌年 5 月 / 月','July–following May / month']]" :key="id"><dt>{{ copy(cn, en) }}</dt><dd :id="`final-resident-${id}`">{{ money(finalResident[id]) }} JPY</dd></div></dl>
            <details id="monthly-details"><summary>{{ copy('查看 12 个月明细', 'View all 12 months') }}</summary><table class="months"><caption>{{ copy('工资特别征收 · 概算', 'Payroll collection · estimate') }}</caption><thead><tr><th>{{ copy('月份', 'Month') }}</th><th>{{ copy('金额（日元）', 'Amount (JPY)') }}</th></tr></thead><tbody><tr v-for="month in months" :key="month"><th scope="row">{{ month < 6 ? '2027' : '2026' }} / {{ month }}</th><td>{{ money(month === 6 ? finalResident.june : finalResident.monthly) }}</td></tr></tbody></table></details>
            <details v-if="finalResident.status === 'ready'" class="settlement-details"><summary>{{ copy('查看抵扣与年税额明细', 'View credits and annual tax') }}</summary><dl class="resident-summary"><div v-for="[id, cn, en] in [['housing','住宅借入金等特別税額控除','Housing credit carried to resident tax'],['basic','寄附金税額控除（基本分）','Basic donation credit'],['special','寄附金税額控除（特例分・概算）','Special donation credit (estimate)'],['additional','申告特例控除（ワンストップ）','One-stop additional credit'],['levyAfter','抵扣后所得割額（百元截尾）','Income levy after credits (rounded down to ¥100)'],['fixed','均等割＋森林环境税','Per-capita levy + forest tax']]" :key="id"><dt>{{ copy(cn, en) }}</dt><dd>{{ money(finalResident[id]) }} JPY</dd></div></dl><p class="small">{{ copy('故乡税抵扣沿用上方所得税率代用，分档边界可能有偏差。調整控除合计按3:2分配，日元余数归都道府县。仅计算故乡税，未合并其他捐款的额度限制。', 'Donation relief uses the pre-donation income-tax rate as a proxy and may differ near bracket boundaries. The adjustment credit is split 3:2, with any yen remainder assigned to the prefecture. Shared limits with other donations are not assessed.') }}</p><p class="small">{{ copy('两级所得割分别舍弃不满100日元部分后合计，再加均等割与森林环境税，得到年税额。', 'Each income levy is rounded down to ¥100 and combined; adding the per-capita levy and forest tax gives the annual bill.') }}</p><div class="source-grid"><a :href="source.furusato" target="_blank" rel="noopener noreferrer">{{ copy('国税厅：故乡税抵扣规则 ↗', 'NTA: furusato tax relief ↗') }}</a><a :href="source.annualRounding" target="_blank" rel="noopener noreferrer">{{ copy('中野区：所得割百元截尾 ↗', 'Nakano: income-levy rounding ↗') }}</a></div></details>
          </section>
          <div class="actions"><button id="clear-inputs" type="button" @click="clear">{{ copy('清空全部输入', 'Clear all inputs') }}</button></div><p class="privacy">{{ copy('输入不保存、不上传；刷新或切换语言后清空。', 'Inputs are not saved or uploaded; refreshing or changing language clears them.') }}</p><span class="sr-only" role="status">{{ announcement }}</span>
      </div>
      <section class="sources" aria-labelledby="sources-title">
        <h2 id="sources-title">{{ copy('规则与来源', 'Rules & sources') }}</h2>
        <p>{{ copy('规则核对日期：2026-09-06。具体适用年度见公式与来源。', 'Rules checked: 2026-09-06. See formulas and sources for applicable tax years.') }}</p>
        <details class="calculation-context"><summary>{{ copy('计算范围与未覆盖项目', 'Scope & exclusions') }}</summary>
          <p>{{ copy('现有工资算法仍采用2025年精确表，住民税按对应次年度估算。2026年工资扣除和扶养所得门槛已有修订，尚未切换；核对日期不表示支持任意年度。', 'The salary engine still uses the exact 2025 table, with the corresponding following-year resident-tax estimate. The 2026 salary-deduction and dependent-income amendments are not implemented; the review date does not imply support for every year.') }} <a :href="source.revision2026" target="_blank" rel="noopener noreferrer">{{ copy('国税厅：2026年改正 ↗', 'NTA: 2026 amendments ↗') }}</a></p>
          <p>{{ copy('已计算工资所得、所得税及復興特別所得税；提供故乡税上限、退税或补缴、年度及月度住民税概算。上方明细为故乡税前金额，下方结算应用捐款与申请方式。', 'Calculates employment income and income taxes; estimates the furusato limit, refund or payment due, and annual/monthly resident tax. The upper breakdown precedes donations; settlement below applies the donation and claim method.') }}</p>
          <p>{{ copy('仅工资所得；已纳入子女/特别残障类所得金額調整控除及按证明填写可能額的房贷抵扣；未计公的年金并存调整、特定支出控除或其他所得税税額控除。所得扣除含基礎控除，按输入金额计算，不自动追加或判断资格。復興特別所得税以「全ての所得に対する所得税額」为基准，不区分居民类别。', 'Salary income only, with the selected child/disability income adjustment and housing-credit entitlement. Salary-plus-pension adjustments, specific-expense deductions and other tax credits are excluded. Deductions include the basic allowance and use your entries; amounts and eligibility are not derived automatically. Reconstruction surtax uses tax on all income without distinguishing residency categories.') }}</p>
          <p>{{ copy('住民税采用一般标准税率 6%＋4%，調整控除手填。仅估算应缴所得割、均等割和森林环境税的情况。已计标准均等割4,000日元、森林环境税1,000日元及年度/月度舍入；已计房贷结转，未计其他税額控除或地方加算。仅估算没有其他捐款的情况。自治体链接是规则参考，不代表所选居住地。', 'Resident tax uses ordinary 6% + 4% rates and a manual adjustment credit. Assumes liability for the income levy, per-capita levy and forest tax. Includes standard fixed charges of ¥4,000 + ¥1,000 and annual/monthly rounding, including eligible housing carryover, excluding other credits and local additions. Estimates assume no other donations. Municipal links are references, not a selected residence.') }}</p>
        </details>
        <details v-for="group in sourceGroups" :key="group.en" class="source-group"><summary>{{ copy(group.zh, group.en) }}</summary><div class="source-grid"><a v-for="[key, cn, en] in group.links" :key="key" :href="source[key]" target="_blank" rel="noopener noreferrer">{{ copy(cn, en) }} ↗</a></div></details>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* Match the mortgage page through the theme-supported content width. */
:global(.vp-theme-container.japan-tax-page) { --content-width: 1200px; }
.tax-shell { color-scheme: light; --jt-ink: #20231f; --jt-muted: #64665f; --jt-accent: #b63824; --jt-line: #cbc7bd; box-sizing: border-box; width: 100%; padding: 24px; background: #f7f4ed; color: var(--jt-ink); font: 16px/1.6 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
.tax-shell *, .tax-shell *::before, .tax-shell *::after { box-sizing: border-box; }
.tax-shell a { color: var(--jt-accent); text-decoration: underline; text-underline-offset: 3px; }
.tax-shell a:hover { text-decoration-thickness: 2px; }
.tax-shell :is(a, button, input, select, summary):focus-visible { outline: 2px solid var(--jt-accent); outline-offset: 3px; }
.tax-content { min-width: 0; }
.hero { padding: 40px 0 16px; }
.tax-shell p { margin: 0 0 12px; }
.preview-note { font-size: 14px; color: var(--jt-accent); }
.tax-shell h1 { margin: 0 0 16px; padding: 0; color: var(--jt-ink); font: 400 clamp(34px, 4vw, 54px)/1.2 Georgia, 'Times New Roman', serif; }
.tax-shell[lang='zh-CN'] h1 { font-family: 'Songti SC', 'Noto Serif CJK SC', serif; line-height: 1.35; }
.intro { font-size: 18px; }
.slip-guide { margin-top: 16px; background: #efeae0; padding: 0 16px; }
.tax-shell summary { cursor: pointer; min-height: 44px; align-content: center; font-size: 14px; }
.slip-guide p { font-size: 14px; }
.slip-guide a { display: inline-block; padding: 12px 0; font-size: 14px; }
.slip-map { display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid #797b71; font-size: 14px; background: #fffdf8; }
.slip-map div { padding: 16px 12px; border-right: 1px solid var(--jt-line); }
.slip-map small { display: block; color: var(--jt-accent); margin-bottom: 8px; }
.calculator { display: flex; flex-direction: column; gap: 32px; padding: 32px 0; max-width: 800px; margin-inline: auto; }
.inputs, .results { min-width: 0; }
.tax-shell h2 { font: 600 24px/1.3 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0 0 24px; border: 0; padding: 0; color: var(--jt-ink); }
.tax-shell h3 { padding: 0; font-size: 20px; color: var(--jt-ink); margin: 0 0 12px; line-height: 1.4; }
.help-heading { position: relative; display: flex; align-items: baseline; gap: 4px; }
.help-heading > :first-child { min-width: 0; }
.help-heading h3, .help-heading label { margin-bottom: 0; }
.source-group { border-top: 1px solid var(--jt-line); }
.source-grid { padding: 4px 0 16px; }
.section-heading { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
.section-heading span, .actions span { font-size: 13px; color: var(--jt-muted); }
.tax-shell .small, .privacy, .result-note { color: var(--jt-muted); font-size: 13px; }
.tax-shell label { display: block; font-size: 14px; margin: 0 0 8px; }
.tax-shell select { width: 100%; min-width: 0; font: inherit; font-size: 14px; color: var(--jt-ink); background: #fffdf8; border: 1px solid #797b71; border-radius: 3px; min-height: 46px; padding: 10px 8px; margin-bottom: 16px; }
.tax-shell button { background: transparent; color: var(--jt-accent); border: 1px solid var(--jt-accent); border-radius: 3px; padding: 9px 16px; min-height: 44px; font: inherit; font-size: 14px; cursor: pointer; }
.tax-shell button:hover:not(:disabled) { background: #eee3d9; }
.tax-shell button:disabled { color: #64665f; border-color: #cbc7bd; cursor: default; }
.deductions, .tax-credits { border: 0; border-top: 1px solid var(--jt-line); padding: 20px 0 0; margin: 0 0 24px; min-width: 0; }
.credit-option, .housing-input { margin-bottom: 24px; }
.check-label { display: flex !important; align-items: flex-start; gap: 10px; min-height: 44px; padding-block: 8px; }
.inline-check input { vertical-align: middle; margin: 0 10px 0 0; accent-color: var(--jt-accent); }
.tax-shell .option-description { font-size: 13px; color: var(--jt-muted); margin: 0 0 0 24px; }
.check-label input { flex: 0 0 auto; margin-top: 4px; accent-color: var(--jt-accent); }
.housing-input > div { margin-top: 16px; }
.deduction-group { margin-top: 32px; }
.tax-shell .deduction-group > h3 { font-size: 20px; margin-bottom: 16px; }
.tax-credits { margin-bottom: 0; padding-bottom: 0; }
.tax-credits > :last-child { margin-bottom: 0; }
.option-copy { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.option-copy strong { font-size: 14px; font-weight: 600; color: var(--jt-ink); overflow-wrap: anywhere; }
.option-copy small { font-size: 13px; font-weight: 400; color: var(--jt-muted); }
.housing-input > .check-label { margin-bottom: 0; }
.housing-input > div > label:not(.check-label), .housing-input .help-heading > label { font-weight: 600; }
.housing-input > div > a, .deduction-scope > a { display: inline-block; min-height: 44px; align-content: center; font-size: 13px; font-weight: 400; }
.housing-input #housing-eligible { margin-top: 4px; }

.deduction-scope { margin-bottom: 0; }
.deductions legend, .tax-credits legend { padding: 0 12px 0 0; font-size: 16px; font-weight: 600; }
.mode-switch { display: flex; gap: 8px; margin-bottom: 12px; }
.mode-switch label { display: flex; gap: 8px; align-items: center; min-height: 44px; padding: 8px 12px; border: 1px solid #797b71; border-radius: 3px; margin: 0; cursor: pointer; }
.mode-switch label:has(input:checked) { background: #eee3d9; border-color: var(--jt-accent); }
.mode-switch input { accent-color: var(--jt-accent); }
.add-row { display: flex; gap: 8px; align-items: start; }
.add-row select { flex: 1; width: 0; }
.item-editor > a { font-size: 13px; display: inline-block; min-height: 44px; align-content: center; }
.deduction-item { padding: 16px; border: 1px solid var(--jt-line); margin-bottom: 16px; }
.deduction-item .remove { padding: 4px 8px; }
.furusato-input { border-top: 1px solid var(--jt-line); padding-top: 24px; }
.actions { display: flex; align-items: center; flex-wrap: wrap; gap: 16px; padding: 16px 0; }
.results { border-top: 1px solid var(--jt-line); padding-top: 28px; }
.result-note { margin-bottom: 20px !important; }
.refund { background: #efeae0; border-top: 3px solid var(--jt-accent); padding: 24px; margin-bottom: 0; }
.refund :deep(.help-popup) { inset-inline: -16px; }
.refund > p, .refund a, .result-block > p, .result-block a { font-size: 13px; }
.refund > p, .result-block > p { color: var(--jt-muted); }
.big-value { color: var(--jt-accent); font-size: 40px; line-height: 1.4; margin: 4px 0 12px; font-variant-numeric: tabular-nums; }
.big-value small { font: 400 13px/1.6 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: var(--jt-muted); }
.result-list { margin: 0; }
.result-list > div { position: relative; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: start; gap: 16px; padding: 12px 0; border-bottom: 1px solid var(--jt-line); }
.result-list .help-heading { position: static; }
.result-list dt { flex: 1; min-width: 0; overflow-wrap: anywhere; }
.resident-intermediate { margin-top: 28px; }
.calculation-formulas { font-size: 14px; margin-top: 20px; }
.result-list dt > small { display: block; color: var(--jt-muted); font-size: 13px; }
.result-list dd { overflow-wrap: anywhere; max-width: 100%; white-space: normal; text-align: right; margin: 0; font-size: 22px; }
.result-list dd small { font-size: 12px; color: var(--jt-muted); }
.result-list details { font-size: 13px; }
.result-list details p { color: var(--jt-muted); }
.result-block { border-top: 1px solid var(--jt-line); padding-top: 28px; }
.limit-formula { font-size: 14px; margin-bottom: 16px; }
.resident-summary { margin: 16px 0; }
.resident-summary > div { display: flex; justify-content: space-between; gap: 16px; padding: 8px 0; font-size: 14px; border-bottom: 1px solid var(--jt-line); }
.resident-summary dd { margin: 0; white-space: nowrap; }
.settlement-details { font-size: 13px; }
.settlement-details .resident-summary > div { flex-wrap: wrap; gap: 4px 12px; }
.months { width: 100%; display: table; font-size: 14px; border-collapse: collapse; }
.months caption { text-align: left; color: var(--jt-muted); margin-block: 12px; }
.months th, .months td { text-align: left; padding: 8px; border: 1px solid var(--jt-line); background: #f7f4ed; color: var(--jt-ink); }
.sources { border-top: 1px solid var(--jt-line); padding-top: 28px; }
.sources > p { color: var(--jt-muted); font-size: 14px; }
.source-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; }
.source-grid a { min-height: 44px; align-content: center; font-size: 14px; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@media (max-width: 850px) { .calculator { grid-template-columns: 1fr; gap: 24px; } .results { border-left: 0; border-top: 1px solid var(--jt-line); padding: 28px 0 0; } .slip-map { grid-template-columns: 1fr 1fr; } }
@media (max-width: 600px) { .result-list dd { font-size: 18px; } .tax-shell { padding: 12px; } .hero { padding-top: 28px; } .tax-shell h1 { font-size: 34px; } .intro { font-size: 16px; } .calculator { padding-top: 28px; } .tax-shell h2 { font-size: 22px; } .refund { padding: 20px; } .source-grid { grid-template-columns: 1fr; } .mode-switch label { padding-inline: 8px; } }
</style>

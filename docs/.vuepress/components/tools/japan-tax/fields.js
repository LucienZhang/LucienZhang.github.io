// Bilingual field definitions and official calculation references.
export const source = {
  housingSlip: 'https://www.nta.go.jp/publication/pamph/hotei/tebikihtml/2-2-18.htm',
  residentHousing: 'https://www.city.nishitokyo.lg.jp/kurasi/zeikin/kozinsiminzei/jyutakuron.html',

  childSupport: 'https://www.cfa.go.jp/policies/kodomokosodateshienkinseido',
  incomeAdjustment: 'https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1411.htm',
  housing: 'https://www.nta.go.jp/publication/pamph/koho/kurashi/html/05_1.htm',
  revision2026: 'https://www.nta.go.jp/users/gensen/2026kiso/index.htm',
  insuranceRules: 'https://www.nta.go.jp/publication/pamph/koho/kurashi/html/04_2.htm',
  socialSlip: 'https://www.nta.go.jp/taxes/shiraberu/shinkoku/tebiki/2025/03/order3/3-3_10.htm',
  dcEmployer: 'https://www.nta.go.jp/taxes/shiraberu/taxanswer/hojin/5231.htm',

  settlement: 'https://www.nta.go.jp/taxes/shiraberu/shinkoku/tebiki/2025/03/order4/3-4_41.htm',
  donationRounding: 'https://www.city.katsushika.lg.jp/_res/projects/default_project/_page_/001/001/510/28furusatokeisan.pdf',
  annualRounding: 'https://www.city.tokyo-nakano.lg.jp/kurashi/zeikin/jyuminzei-kazei/jyuminzei-keisanshiki.html',
  monthlyRounding: 'https://www.town.aichi-mihama.lg.jp/soshiki/zeimu/juminzei/1/2/5/25.html',
  smallAnnual: 'https://www.city.kitami.lg.jp/detail.php?content=8271',
  residentRates: 'https://www.city.tokyo-nakano.lg.jp/kurashi/zeikin/jyuminzei-kazei/jyuminzei-keisanrei.html',
  residentDeductions: 'https://www.city.yokohama.lg.jp/kurashi/koseki-zei-hoken/zeikin/y-shizei/kojin-shiminzei-kenminzei/kojin-shiminzei-shosai/shotokukoujoR8.html',
  adjustment: 'https://www.city.kyoto.lg.jp/gyozai/page/0000028147.html',
  residentDonation: 'https://www.city.kyoto.lg.jp/gyozai/page/0000054663.html',
  refund: 'https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/2030.htm',
  salaryTable: 'https://www.nta.go.jp/taxes/shiraberu/shinkoku/tebiki/2025/03/order2/3-2_06.htm',
  reconstruction: 'https://www.nta.go.jp/publication/pamph/shotoku/fukko_tokubetsu/index.htm',
  salary: 'https://www.nta.go.jp/publication/pamph/hotei/tebikihtml/2-2-3.htm',
  withheld: 'https://www.nta.go.jp/publication/pamph/hotei/tebikihtml/2-2-6.htm',
  total: 'https://www.nta.go.jp/publication/pamph/hotei/tebikihtml/2-2-5.htm',
  form: 'https://www.nta.go.jp/publication/pamph/hotei/tebikihtml/2-2-0.htm',
  income: 'https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1410.htm',
  deductions: 'https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1100.htm',
  furusato: 'https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1155.htm',
  rate: 'https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/2260.htm',
  resident: 'https://www.city.shinjuku.lg.jp/hoken/file04_04_00001.html',
};
export const primaryFields = [
  { id: 'salary', jp: '給与等の収入金額', zh: '税前工资收入', en: 'Gross employment income',
    zhHelp: '填写源泉徴収票的「支払金額」，不是银行到账的到手工资。',
    enHelp: 'Use 支払金額 on the withholding slip, not your take-home pay.',
    zhWhere: '上部金额栏「支払金額」· 官方说明③', enWhere: 'Upper amount row: 支払金額 · official field ③', source: source.salary },
  { id: 'withheld', jp: '源泉徴収税額', zh: '已预扣所得税等', en: 'Tax withheld',
    zhHelp: '所得税及復興特別所得税的合计。已年末调整时，填写调整后的票面金额。',
    enHelp: 'Combined income tax and reconstruction surtax withheld. If year-end adjustment was performed, use the adjusted amount on the slip.',
    zhWhere: '上部金额栏最右侧「源泉徴収税額」· 官方说明⑥', enWhere: 'Rightmost box in the upper amount row: 源泉徴収税額 · official field ⑥', source: source.withheld },
];
export const totalField = { id: 'total', jp: '所得控除の額の合計額', zh: '所得扣除合计', en: 'Total income deductions',
  zhHelp: '含基礎控除，不含故乡税寄附金控除；申报合计若已包含，先减去该扣除额。此处为所得税口径，不可直接复制到住民税。不含給与所得控除或税額控除。',
  enHelp: 'Include the basic allowance; remove any furusato donation deduction already included in filing records. This total follows income-tax rules, not resident-tax rules. Exclude the employment-income deduction and tax credits.',
  zhWhere: '上部「所得控除の額の合計額」· 官方⑤。仅年末调整后填写，空白不等于零。', enWhere: 'Upper row: 所得控除の額の合計額 · field ⑤. Filled after year-end adjustment; blank does not mean zero.', source: source.total };
// A catalogue for item selection, not a claim that every item applies to every year or person.
export const deductionFields = [
  ['basic', '基礎控除', '基础扣除', 'Basic deduction', '按本人合計所得金額分档；超过2,500万日元为0。所得不是税前工资，也不是减完所得扣除后的課税所得；扣除额还需对应收入年度。', 'Varies with your total income and tax year; zero above ¥25 million total income. This is neither gross salary nor taxable income after income deductions.', '1199'],
  ['social', '社会保険料控除', '社会保险扣除', 'Social insurance deduction', '本人实际支付的适用社会保险费全额，无本人所得上限。医疗保险中的子ども・子育て支援金个人负担部分计入本项，已含在保费合计中时勿重复加算；不含公司负担。', 'Eligible premiums you actually pay are fully deductible, without a personal-income ceiling. Include your share of child-support contributions collected with health insurance once; exclude employer contributions.', '1130'],
  ['pension', '小規模企業共済等掛金控除', 'DC／iDeCo・共济缴费扣除', 'DC / iDeCo / mutual-aid deduction', '含企业型DC本人加入者掛金（matching contributions）和iDeCo，适用缴费全额扣除，无本人所得上限；须符合加入资格和缴费限额。公司DC出资不是个人所得扣除，不要重复填写。', 'Includes your corporate DC matching contributions and iDeCo payments, fully deductible within contribution and membership rules; no personal-income ceiling. Employer DC contributions are not your income deduction.', '1135'],
  ['life', '生命保険料控除', '人寿保险扣除', 'Life insurance deduction', '无本人所得上限；按新旧合同、保险类别及年度计算，所得税合计上限12万日元，住民税7万日元。填写扣除额，不是保费原额；育儿家庭的年度特例另见官方说明。', 'No personal-income ceiling. Limits depend on contract, category and year: ¥120,000 overall for income tax and ¥70,000 for resident tax. Enter the deduction, not premiums; check annual child-related exceptions.', '1140'],
  ['quake', '地震保険料控除', '地震保险扣除', 'Earthquake insurance deduction', '填写已确定的扣除额，不是保费支付额。', 'Enter the established deduction, not premiums paid.', '1145'],
  ['spouse', '配偶者控除・配偶者特別控除', '配偶者扣除', 'Spouse deduction / special deduction', '两种择一，不重复申报；本人合計所得金額超过1,000万日元不适用，超过900万、950万时分档递减。还需核对配偶者所得、婚姻等条件。', 'Claim only the applicable type. Unavailable above ¥10 million of your total income, with reductions above ¥9 million and ¥9.5 million. Spouse income and other eligibility also matter.', '1191'],
  ['dependants', '扶養控除', '抚养扣除', 'Dependent deduction', '无申报人本人所得上限。通常须年末满16岁、生计同一且亲属所得符合当年门槛；16岁以下不能填扶養控除。海外亲属另有条件，不可夫妻重复申报。', 'No claimant-income ceiling. Generally requires age 16 or over at year end, shared livelihood and the relative meeting that year’s income limit. Overseas relatives have extra conditions; parents cannot duplicate the same dependent claim.', '1180'],
  ['relative', '特定親族特別控除', '特定亲属特别扣除', 'Special deduction for specified relatives', '年度及亲属条件需另行核验，不能仅按人数填写。', 'Year and relative eligibility need verification; not a simple headcount.', '1177'],
  ['disability', '障害者控除', '残障扣除', 'Disability deduction', '本人或符合条件的配偶者、亲属对应的扣除额。', 'Allowance for an eligible person, spouse or dependent with a disability.', '1160'],
  ['widow', '寡婦控除', '寡妇扣除', 'Widow deduction', '本人合計所得金額须不超过500万日元，并满足婚姻、事实婚姻和扶养等条件；不与ひとり親控除重复。', 'Your total income must not exceed ¥5 million, with marital, partner and dependent conditions. Do not combine with the single-parent deduction.', '1170'],
  ['single', 'ひとり親控除', '单亲扣除', 'Single-parent deduction', '本人合計所得金額须不超过500万日元，还需满足子女所得、生计和婚姻等条件；不与寡婦控除重复。', 'Your total income must not exceed ¥5 million; child income, shared livelihood and marital conditions also apply. Do not combine with the widow deduction.', '1171'],
  ['student', '勤労学生控除', '勤劳学生扣除', 'Working-student deduction', '符合勤劳学生条件时适用的扣除额。', 'Allowance for an eligible working student.', '1175'],
  ['medical', '医療費控除', '医疗费扣除', 'Medical expense deduction', '填写已确定扣除额，不是医疗费原始合计；不在源泉徴収票中单列。', 'Enter the established deduction, not raw medical expenses; not a separate withholding-slip field.', '1120'],
  ['loss', '雑損控除', '灾害等损失扣除', 'Casualty-loss deduction', '符合条件的灾害、盗窃等损失扣除额；不在票中单列。', 'Deduction for qualifying casualty or theft losses; not separately shown on the slip.', '1110'],
  ['donation', '寄附金控除（ふるさと納税以外）', '其他捐款扣除', 'Other donation deductions', '这里只填写故乡税以外的寄附金所得控除额；故乡税在下方独立记录。', 'Income deduction for donations other than furusato nozei, which is recorded separately below.', '1150'],
].map(([id, jp, zh, en, zhHelp, enHelp, code]) => ({ id, jp, zh, en, zhHelp, enHelp, source: `https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/${code}.htm`,
  ...({
    social: { zhWhere: '源泉徴収票「社会保険料等の金額」若含内书的小規模企業共済等掛金，先剔除内书额，避免与DC重复。支援金自2026年4月分起征收，按实际支付年度计入。', enWhere: 'If the slip’s social-insurance total includes an inset mutual-aid/DC amount, subtract that inset to avoid duplication. Child-support contributions start with April 2026 premiums; use the year actually paid.', references: [[source.childSupport, 'こども家庭庁：支援金', 'CFA: child-support contributions'], [source.socialSlip, '国税厅：票据内书金额', 'NTA: inset amounts on the slip']] },
    pension: { zhWhere: '查掛金払込証明書；工资扣除部分可查源泉徴収票「社会保険料等の金額」内书，不要再计入社会保険料控除。', enWhere: 'Use the contribution certificate; payroll contributions may appear as an inset in the slip’s social-insurance box. Do not also claim that amount as social insurance.', references: [[source.dcEmployer, '国税厅：企业DC出资与本人缴费', 'NTA: employer and employee DC contributions']] },
    life: { references: [[source.insuranceRules, '国税厅：保険と税（含育儿特例）', 'NTA: insurance and child-related exceptions']] },
    basic: { references: [[source.revision2026, '国税厅：2026年改正', 'NTA: 2026 amendments']] },
    dependants: { references: [[source.revision2026, '国税厅：扶养所得门槛改正', 'NTA: dependent-income threshold amendments']] },
  }[id] ?? {}),
}));
export const resultFields = [
  ['incomeAdjustmentAmount', '所得金額調整控除額', '工资所得调整额', 'Employment-income adjustment', '符合所选子女/特别残障条件且工资超过850万日元时，(min(工资,1000万)−850万)×10%，不足1日元进位，最高15万；不按子女人数倍增。', 'For the selected child/disability eligibility and salary above ¥8.5m: (min(salary, ¥10m) − ¥8.5m) × 10%, rounded up to yen, capped at ¥150,000; not multiplied by child count.', source.incomeAdjustment],

  ['income', '給与所得', '工资所得', 'Employment income', '按 2025 年官方精确表减去給与所得控除；按所选条件减去所得金額調整控除；未计特定支出控除。', 'After the 2025 employment-income deduction; includes the selected income adjustment, but not specific-expense deductions.', source.income],
  ['taxable', '課税される所得金額', '课税所得', 'Taxable income', '給与所得减去所得控除，最低为 0；舍弃不满 1,000 日元的部分。', 'Employment income minus deductions, floored at zero and rounded down to ¥1,000.', source.rate],
  ['rate', '所得税率', '所得税边际税率', 'Marginal income tax rate', '对应课税所得的税率档位，不是工资整体的平均税率。', 'Rate for the taxable-income band, not an average rate on gross salary.', source.rate],
  ['taxBeforeHousing', '住宅控除前の所得税額', '房贷抵扣前所得税', 'Income tax before housing credit', '課税所得×边际税率−速算扣除额。房贷税額控除不改变課税所得或税档。', 'Taxable income × marginal rate − quick deduction. Housing credits do not change taxable income or its tax band.', source.rate],
  ['housingUsed', '住宅借入金等特別控除額', '所得税实际房贷抵扣', 'Housing credit used against income tax', '适用控除可能額与抵扣前所得税额取较小者。超过所选本人所得上限时为0。', 'The smaller of eligible credit entitlement and pre-credit income tax; zero above the selected total-income ceiling.', source.housingSlip],
  ['tax', '所得税額', '所得税', 'Income tax', '課税所得 × 所得税率 − 速算扣除额，已减本页适用的房贷税額控除。', 'Taxable income × marginal rate − quick deduction, after the applicable housing credit entered here.', source.rate],
  ['reconstruction', '復興特別所得税額', '复兴特别所得税', 'Reconstruction surtax', '基准所得税额 × 2.1%，不足 1 日元舍弃；以房贷抵扣后、全所得对应的所得税为基准。', 'Base income tax × 2.1%, rounded down to whole yen; uses tax on all income after housing relief.', source.reconstruction],
];

export const residentTotalField = {
  id: 'resident-total', jp: '所得控除の額の合計額（住民税用）', zh: '住民税所得扣除合计', en: 'Total deductions for resident tax',
  zhHelp: '填写2026年度住民税口径的扣除合计，含基礎控除。与所得税的扣除额可能不同；不含調整控除、捐款或房贷税额抵扣。',
  enHelp: 'Enter deductions under 2026 resident-tax rules, including the basic allowance. Amounts may differ from income-tax deductions. Exclude adjustment, donation and housing tax credits.',
  zhWhere: '查对应年度住民税税额通知书的所得控除栏或明细合计；源泉徴収票没有此合计。', enWhere: 'Use the income-deduction section of the matching resident-tax notice. This total is not on the withholding slip.',
  source: source.residentDeductions,
};
export const adjustmentField = {
  id: 'adjustment', jp: '調整控除額', zh: '住民税调整控除额（市区町村＋都道府县合计）', en: 'Resident adjustment credit (combined municipal + prefectural)',
  zhHelp: '直接抵扣住民税所得割，填两级税的合计；不是人的控除差额。无适用填 0，合计所得超过 2,500 万日元时不适用。',
  enHelp: 'A credit against the resident income levy. Enter both tax components combined, not the personal-deduction difference. Use 0 if inapplicable; unavailable above ¥25 million total income.',
  zhWhere: '查对应年度住民税通知书或计算明细中的「調整控除」；不要填税額控除合计。未单列时按官方说明计算或向自治体核实。',
  enWhere: 'Find 調整控除 in the matching notice or calculation breakdown, not total tax credits. If absent, calculate using official guidance or confirm with the municipality.',
  source: source.adjustment,
};

export const housingAmountField = { id: 'housing-amount', jp: '住宅借入金等特別控除可能額', zh: '当年可用房贷控除额（抵税前）', en: 'Annual housing credit entitlement (before use)',
  zhHelp: '填写计算明细或证明书按当年余额、适用比例和限额计算后的金额（100日元整数倍），不是贷款余额，也不是扣除后的剩余金额。仅计算其抵税及住民税结转，房屋资格和可用年限须先按证明确认。',
  enHelp: 'Use the annual entitlement calculated on your worksheet or certificate from the eligible balance, rate and limits (multiples of ¥100). Not the loan balance or unused remainder. This tool applies the credit and carryover; confirm property eligibility and remaining term first.',
  zhWhere: '源泉徴収票有「住宅借入金等特別控除可能額」时用该额；该栏空白且已全额抵扣时可用「住宅借入金等特別控除の額」。首次申报用计算明细，不把两栏相加。',
  enWhere: 'Use 住宅借入金等特別控除可能額 if shown on the slip. If blank because the full credit was used, use 住宅借入金等特別控除の額. For a first claim, use the calculation worksheet. Do not add the two boxes.', source: source.housingSlip };

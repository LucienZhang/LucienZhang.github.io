// 2025 salary-only calculation. Sources and scope: .ai/tools/japan-tax/rules.md.
// Integer yen throughout; blank/invalid entries must never become zero.
export function yen(value) {
  return typeof value === 'string' && /^\d{1,16}$/.test(value) ? BigInt(value) : null;
}
export function employmentIncome(salary) {
  if (salary <= 650999n) return 0n;
  if (salary < 1900000n) return salary - 650000n;
  const quarter = salary / 4000n * 1000n;
  if (salary < 3600000n) return quarter * 28n / 10n - 80000n;
  if (salary < 6600000n) return quarter * 32n / 10n - 440000n;
  if (salary < 8500000n) return salary * 9n / 10n - 1100000n;
  return salary - 1950000n;
}
const brackets = [[40000000n,45n,4796000n],[18000000n,40n,2796000n],[9000000n,33n,1536000n],[6950000n,23n,636000n],[3300000n,20n,427500n],[1950000n,10n,97500n],[0n,5n,0n]];
export function taxOnIncome(taxable) {
  if (taxable === 0n) return { rate: 0n, quickDeduction: 0n, tax: 0n, reconstruction: 0n };
  const [, rate, quickDeduction] = brackets.find(([threshold]) => taxable >= threshold);
  const tax = taxable * rate / 100n - quickDeduction;
  return { rate, quickDeduction, tax, reconstruction: tax * 21n / 1000n };
}
// Child / special-disability income adjustment (NTA 1411), not an income deduction.
export function employmentAdjustment(salary, eligible = false) {
  if (!eligible || salary <= 8500000n) return 0n;
  const capped = salary < 10000000n ? salary : 10000000n;
  return (capped - 8500000n + 9n) / 10n;
}

// The entered amount is the established annual credit entitlement before the
// income-tax liability cap, not the loan balance or the credit already used.
export function housingRelief(income, taxable, tax, housing) {
  if (!housing?.enabled) return { status: 'ready', housingPotential: 0n, housingUsed: 0n, housingResident: 0n, housingExcluded: false };
  if (!housing.eligible || !['10000000','20000000','30000000'].includes(housing.incomeLimit)
    || !['standard','enhanced','none'].includes(housing.residentBand)
    || !['first','continuing'].includes(housing.stage)) return { status: 'housingConditions' };
  const entered = yen(housing.amount);
  if (entered === null || entered % 100n !== 0n) return { status: 'housingAmount' };
  const housingExcluded = income > BigInt(housing.incomeLimit);
  const housingPotential = housingExcluded ? 0n : entered;
  const housingUsed = housingPotential < tax ? housingPotential : tax;
  const unused = housingPotential - housingUsed;
  const percent = housing.residentBand === 'enhanced' ? 7n : housing.residentBand === 'standard' ? 5n : 0n;
  const cap = percent === 7n ? 136500n : percent === 5n ? 97500n : 0n;
  const percentageCap = taxable * percent / 100n;
  const limit = cap < percentageCap ? cap : percentageCap;
  return { status: 'ready', housingPotential, housingUsed, housingResident: unused < limit ? unused : limit, housingExcluded };
}

export function calculate({ salary, deductions, incomeAdjustment = false, housing }) {
  const amount = yen(salary);
  if (amount === null) return { status: 'salary' };
  const incomeBeforeAdjustment = employmentIncome(amount);
  const incomeAdjustmentAmount = employmentAdjustment(amount, incomeAdjustment);
  const income = incomeBeforeAdjustment - incomeAdjustmentAmount;
  // The special minimum-tax regime above this income is outside this first version.
  if (income > 330000000n) return { status: 'range' };
  const parsed = deductions.map(yen);
  if (!parsed.length || parsed.some(value => value === null)) return { status: 'deductions', income };
  const deductionTotal = parsed.reduce((sum, value) => sum + value, 0n);
  const taxable = (income > deductionTotal ? income - deductionTotal : 0n) / 1000n * 1000n;
  const gross = taxOnIncome(taxable);
  const relief = housingRelief(income, taxable, gross.tax, housing);
  if (relief.status !== 'ready') return { status: relief.status, income, incomeBeforeAdjustment, incomeAdjustmentAmount };
  const tax = gross.tax - relief.housingUsed;
  return { ...gross, ...relief, income, incomeBeforeAdjustment, incomeAdjustmentAmount, deductionTotal, taxable,
    taxBeforeHousing: gross.tax, tax, reconstruction: tax * 21n / 1000n };
}

// 2026 resident-tax intermediate amounts, ordinary 6% + 4% rates.
// User supplies established resident deductions and the combined adjustment credit.
export function calculateResident({ salary, deductions, adjustment, incomeAdjustment = false }) {
  const base = calculate({ salary, deductions, incomeAdjustment });
  if (base.status !== 'ready') return { status: base.status };
  const credit = yen(adjustment);
  if (credit === null) return { status: 'adjustment', taxable: base.taxable };
  const municipalBeforeCredit = base.taxable * 6n / 100n;
  const prefecturalBeforeCredit = base.taxable * 4n / 100n;
  const beforeCredit = municipalBeforeCredit + prefecturalBeforeCredit;
  if (credit > beforeCredit || (base.income > 25000000n && credit !== 0n)) return { status: 'adjustmentRange', taxable: base.taxable };
  return { status: 'ready', taxable: base.taxable, deductionTotal: base.deductionTotal, beforeCredit, adjustment: credit, levy: beforeCredit - credit };
}

// Authorized estimate: use the income-tax marginal rate as a proxy for the
// special resident-credit rate. This is not an exact fully deductible limit.
export function estimateFurusatoLimit(national, resident) {
  if (national.status !== 'ready' || resident.status !== 'ready') return { status: 'incomplete' };
  if (resident.levy === 0n) return { status: 'noLevy', amount: 0n };
  if (national.rate === 0n) return { status: 'noIncomeTax' };
  const denominator = 90000n - national.rate * 1021n;
  return { status: 'ready', amount: 2000n + resident.levy * 20000n / denominator, rate: national.rate };
}

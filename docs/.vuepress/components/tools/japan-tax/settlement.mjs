// Salary-only estimates for 2025 income / 2026 resident tax.
// Official references, assumptions and rounding: .ai/tools/japan-tax/settlement-rules.md.
import { yen, taxOnIncome, housingRelief } from './tax-calculation.mjs';
const min = (a, b) => a < b ? a : b;
const positive = n => n > 0n ? n : 0n;
const ceil = (n, d) => (n + d - 1n) / d;

export function payrollSchedule(annual) {
  // Small annual bills are collected in full in the first month.
  const monthly = annual <= 5000n ? 0n : annual / 1200n * 100n;
  return { annual, june: annual - monthly * 11n, monthly };
}

export function estimateSettlement({ national, resident, salary, withheld, donation, method, hasOtherDonations = false, housing }) {
  const empty = status => ({ national: { status }, resident: { status } });
  if (national.status !== 'ready') return empty(national.status.startsWith('housing') ? national.status : 'inputs');
  const gift = yen(donation);
  if (gift === null) return empty('donation');
  if (gift > 0n && hasOtherDonations) return empty('otherDonations');
  if (gift > 0n && !['return', 'one-stop'].includes(method)) return empty('method');
  const oneStop = gift > 0n && method === 'one-stop';
  // This condition is already knowable from the salary input; other eligibility
  // conditions (five municipalities, no other return) remain explicit assumptions.
  if (housing?.enabled && housing.stage === 'first' && method !== 'return') return empty('housingFirstReturn');
  if (oneStop && yen(salary) > 20000000n) return empty('oneStopIneligible');
  const deduction = oneStop ? 0n : positive(min(gift, national.income * 4n / 10n) - 2000n);
  // Recompute from the unrounded income and deductions, including bracket changes.
  const taxable = positive(national.income - national.deductionTotal - deduction) / 1000n * 1000n;
  const gross = taxOnIncome(taxable);
  const housingResult = housingRelief(national.income, taxable, gross.tax, housing);
  if (housingResult.status !== 'ready') return empty(housingResult.status);
  const tax = gross.tax - housingResult.housingUsed;
  const after = { ...gross, ...housingResult, taxBeforeHousing: gross.tax, tax, reconstruction: tax * 21n / 1000n };
  const total = after.tax + after.reconstruction;
  const paid = yen(withheld);
  const nationalResult = oneStop
    ? { status: 'ready', kind: 'one-stop', refund: 0n, due: 0n, deduction, taxable, ...after, total, relief: 0n }
    : paid === null ? { status: 'withheld' }
    : { status: 'ready', kind: 'return', refund: positive(paid - total), due: positive(total - paid) / 100n * 100n,
      deduction, taxable, ...after, total, relief: national.tax + national.reconstruction - total };

  if (hasOtherDonations) return { national: nationalResult, resident: { status: 'otherDonations' } };
  if (resident.status !== 'ready') return { national: nationalResult, resident: { status: 'inputs' } };
  // With a zero taxable base the flat-tax/exemption outcome cannot be inferred.
  if (resident.taxable === 0n) return { national: nationalResult, resident: { status: 'exemption' } };
  if (gift > 2000n && national.rate === 0n) return { national: nationalResult, resident: { status: 'rate' } };
  const rate = national.rate;
  const specialFactor = 90000n - rate * 1021n;
  const basicBase = positive(min(gift, national.income * 3n / 10n) - 2000n);
  const specialBase = positive(gift - 2000n);
  // Standard adjustment credits use a 3:2 municipal/prefectural split.
  // Preserve a manually entered combined integer total if it has a remainder.
  const municipalAdjustment = resident.adjustment * 3n / 5n;
  const prefecturalAdjustment = resident.adjustment - municipalAdjustment;
  // Housing credit precedes donations. Keep the special-donation 20% cap
  // based on levy after adjustment, before housing (ordinary 6% + 4%).
  const municipalHousing = housingResult.housingResident * 3n / 5n;
  const prefecturalHousing = housingResult.housingResident - municipalHousing;
  const components = [[6n, 3n, municipalAdjustment], [4n, 2n, prefecturalAdjustment]].map(([taxRate, share, adjustment]) => {
    const levy = resident.taxable * taxRate / 100n - adjustment;
    const basic = ceil(basicBase * taxRate, 100n);
    const special = ceil(min(specialBase * specialFactor * share, levy * 100000n), 500000n);
    const oneStopRate = min(rate, 33n);
    const additional = oneStop ? ceil(special * oneStopRate * 1021n, 90000n - oneStopRate * 1021n) : 0n;
    const housingCredit = min(levy, share === 3n ? municipalHousing : prefecturalHousing);
    const credit = min(levy - housingCredit, basic + special + additional);
    return { levy, housingCredit, basic, special, additional, credit, after: (levy - housingCredit - credit) / 100n * 100n };
  });
  const [municipal, prefectural] = components;
  const levyAfter = municipal.after + prefectural.after;
  const fixed = 5000n; // Standard per-capita 3,000 + 1,000, national forest tax 1,000.
  return {
    national: nationalResult,
    resident: { status: 'ready', housing: municipal.housingCredit + prefectural.housingCredit, rate, municipal, prefectural, levyAfter, fixed,
      basic: municipal.basic + prefectural.basic, special: municipal.special + prefectural.special,
      additional: municipal.additional + prefectural.additional, credit: municipal.credit + prefectural.credit,
      ...payrollSchedule(levyAfter + fixed) },
  };
}

import { calculate } from '../../../prototype/loan.mjs';
export const defaults = { amount: 50000000, a: { method: 'payment', rate: 1.5, months: 420 }, b: { method: 'principal', rate: 1.5, months: 420 } };
export function errors(input) {
  const result = {};
  if (!Number.isInteger(input.amount) || input.amount < 1 || input.amount > 1e10) result.amount = true;
  for (const id of ['a', 'b']) {
    const p = input[id] || {};
    if (!['payment', 'principal'].includes(p.method)) result[id + '-method'] = true;
    if (typeof p.rate !== 'number' || !Number.isFinite(p.rate) || p.rate < 0 || p.rate > 20) result[id + '-rate'] = true;
    if (!Number.isInteger(p.months) || p.months < 1 || p.months > 600) result[id + '-months'] = true;
  }
  return result;
}
// Temporary non-whole-year extension: PV discount-factor sum, not a second annuity formula.
// Whole-year schedules reuse the stable prototype interface, scaled by homogeneity in P.
// See .ai/tools/mortgage/shared-core.patch for the integrator's extraction/replacement.
function schedule(amount, plan) {
  let rows;
  if (plan.months % 12 === 0 && plan.months <= 480) {
    rows = calculate({ amount: 1000000, rate: plan.rate, years: plan.months / 12 })[plan.method].rows.map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, key === 'month' ? value : value * amount / 1000000])));
  } else {
    const r = plan.rate / 1200;
    // Remaining present-value factors avoid amplification of balance-subtraction error
    // at the extended 50-year/high-rate boundary. Kahan summation preserves small terms.
    const pv = [0];
    let correction = 0;
    for (let m = 1; m <= plan.months; m++) {
      const term = Math.exp(-m * Math.log1p(r)) - correction;
      const total = pv[m - 1] + term;
      correction = (total - pv[m - 1]) - term;
      pv.push(total);
    }
    let balance = amount;
    rows = Array.from({ length: plan.months }, (_, i) => {
      const interest = balance * r;
      const nextBalance = plan.method === 'payment' ? amount * pv[plan.months - i - 1] / pv[plan.months] : amount * (plan.months - i - 1) / plan.months;
      const principal = balance - nextBalance;
      balance = nextBalance;
      return { month: i + 1, payment: principal + interest, principal, interest, balance };
    });
  }
  let cumulative = 0, paid = 0;
  return [{ month: 0, payment: 0, principal: 0, interest: 0, balance: amount, cumulative: 0, paid: 0 }, ...rows.map(row => ({ ...row, cumulative: cumulative += row.interest, paid: paid += row.payment }))];
}
export function compare(input) {
  if (Object.keys(errors(input)).length) throw new RangeError('Invalid mortgage input');
  const a = schedule(input.amount, input.a), b = schedule(input.amount, input.b);
  const months = Math.max(input.a.months, input.b.months);
  const at = (rows, m) => rows[m] || { ...rows.at(-1), month: m, payment: 0, principal: 0, interest: 0 };
  return { input: { amount: input.amount, a: { ...input.a }, b: { ...input.b } }, months, rows: Array.from({ length: months + 1 }, (_, m) => ({ month: m, a: at(a, m), b: at(b, m) })) };
}
// Monetary comparison tolerance: 0.00001 amount units, well below display precision.
export function crossings(points, tolerance = 1e-5) {
  const sign = value => Math.abs(value) <= tolerance ? 0 : Math.sign(value);
  const equal = [], flips = [];
  let lastNonzero;
  for (let i = 0; i < points.length; i++) {
    const p = points[i], s = sign(p.value);
    if (!s) equal.push(p.month);
    else {
      if (lastNonzero && s !== sign(lastNonzero.value)) {
        const previous = points[i - 1];
        flips.push({ month: !sign(previous.value) ? previous.month : previous.month + (p.month - previous.month) * -previous.value / (p.value - previous.value), first: p.month, sign: s, throughEquality: !sign(previous.value) });
      }
      lastNonzero = p;
    }
  }
  return { coincident: equal.length === points.length, equal, flips };
}
export const metricPoints = (result, metric, start = 1) => result.rows.slice(start).map(row => ({ month: row.month, value: row.a[metric] - row.b[metric] }));

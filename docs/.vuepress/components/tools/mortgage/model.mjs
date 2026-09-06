import { fixedSchedules } from '../../../prototype/fixed-schedules.mjs';
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
// Both tools consume one shared schedule.
function schedule(amount, plan) {
  const rows = fixedSchedules({ amount, rate: plan.rate, months: plan.months })[plan.method].rows;
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

// Shared fixed-rate schedule. Retains the homepage's existing numerical path through 480 months.
// Longer terms use remaining present value to prevent recurrence error amplification.
export function fixedSchedules({ amount, rate, months }) {
  if (!(Number.isFinite(amount) && amount > 0 && Number.isFinite(rate) && rate >= 0 && rate <= 20 && Number.isInteger(months) && months >= 1 && months <= 600)) throw new RangeError('Invalid schedule input');
  const r = rate / 1200;
  const payment = r === 0 ? amount / months : amount * r / -Math.expm1(-months * Math.log1p(r));
  const schedules = {};
  for (const method of ['payment', 'principal']) {
    let balance = amount;
    const rows = [];
    for (let month = 1; month <= months; month++) {
      const interest = balance * r;
      const remaining = method === 'payment' && r > 0
        ? amount * Math.expm1(-(months - month) * Math.log1p(r)) / Math.expm1(-months * Math.log1p(r))
        : amount * (months - month) / months;
      const principal = months > 480 ? balance - remaining : month === months ? balance : Math.min(balance, method === 'payment' ? payment - interest : amount / months);
      balance = Math.max(0, balance - principal);
      rows.push({ month, payment: principal + interest, principal, interest, balance });
    }
    schedules[method] = { rows, first: rows[0].payment, last: rows.at(-1).payment, interest: rows.reduce((sum, row) => sum + row.interest, 0) };
  }
  return schedules;
}

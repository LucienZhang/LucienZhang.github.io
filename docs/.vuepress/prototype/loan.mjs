// Fixed nominal annual rate, monthly periods. See .ai/phase5/homepage-prototype-report.md.
export const defaults = Object.freeze({ amount: 300000, rate: 4, years: 25 });

export function validate(input) {
  return {
    amount: !(typeof input.amount === 'number' && Number.isFinite(input.amount) && input.amount >= 1000 && input.amount <= 10000000 && Math.abs(input.amount * 100 - Math.round(input.amount * 100)) < 0.000001),
    rate: !(typeof input.rate === 'number' && Number.isFinite(input.rate) && input.rate >= 0 && input.rate <= 20),
    years: !(Number.isInteger(input.years) && input.years >= 1 && input.years <= 40),
  };
}

export function calculate(input) {
  if (Object.values(validate(input)).some(Boolean)) throw new RangeError('Invalid loan input');
  const { amount, rate, years } = input;
  const months = years * 12;
  const r = rate / 1200;
  const payment = r === 0 ? amount / months : amount * r / -Math.expm1(-months * Math.log1p(r));
  const schedules = {};
  for (const method of ['payment', 'principal']) {
    let balance = amount;
    const rows = [];
    for (let month = 1; month <= months; month++) {
      const interest = balance * r;
      const principal = month === months ? balance : Math.min(balance, method === 'payment' ? payment - interest : amount / months);
      balance = Math.max(0, balance - principal);
      rows.push({ month, payment: principal + interest, principal, interest, balance });
    }
    schedules[method] = { rows, first: rows[0].payment, last: rows.at(-1).payment, interest: rows.reduce((sum, row) => sum + row.interest, 0) };
  }
  return { input: { ...input }, months, ...schedules };
}

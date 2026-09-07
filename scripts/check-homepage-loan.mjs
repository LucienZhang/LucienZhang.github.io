import assert from 'node:assert/strict';
import { calculate, defaults } from '../docs/.vuepress/lib/loan/loan.mjs';
const near = (actual, expected, tolerance = 1e-6) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);
// Independent present-value sum solved by bisection, not the implementation's annuity formula.
function oracle(amount, rate, months) {
  let low = 0, high = amount * 2;
  for (let k = 0; k < 100; k++) {
    const payment = (low + high) / 2;
    let present = 0;
    for (let month = 1; month <= months; month++) present += payment / (1 + rate / 1200) ** month;
    if (present < amount) low = payment; else high = payment;
  }
  return (low + high) / 2;
}
for (const input of [defaults, { amount: 12000, rate: 0, years: 1 }, { amount: 1000, rate: 0.00000001, years: 40 }, { amount: 10000000, rate: 20, years: 40 }, { amount: 1234, rate: 12, years: 1 }]) {
  const result = calculate(input);
  near(result.payment.first, oracle(input.amount, input.rate, result.months), 0.0001);
  near(result.principal.interest, input.amount * input.rate / 1200 * (result.months + 1) / 2, 0.0001);
  for (const method of ['payment', 'principal']) {
    assert.equal(result[method].rows.length, input.years * 12);
    assert.equal(result[method].rows.at(-1).balance, 0);
    near(result[method].rows.reduce((sum, row) => sum + row.principal, 0), input.amount, 0.0001);
    result[method].rows.forEach(row => { assert.ok(row.balance >= 0); assert.ok(row.principal > 0); near(row.payment, row.interest + row.principal); });
  }
}
const zero = calculate({ amount: 12000, rate: 0, years: 1 });
assert.equal(zero.payment.first, 1000); assert.equal(zero.payment.interest, 0);
const hand = calculate({ amount: 12000, rate: 12, years: 1 });
assert.equal(hand.principal.first, 1120); assert.equal(hand.principal.last, 1010); assert.equal(hand.principal.interest, 780);
for (const [key, values] of Object.entries({ amount: ['', '1000', NaN, Infinity, -1, 0, 10000000001, 1000.001], rate: ['', NaN, Infinity, -1, 21], years: [0, 51, 1.5, '', NaN] })) {
  for (const value of values) assert.throws(() => calculate({ ...defaults, [key]: value }), RangeError);
}
console.log('Loan tests passed: independent PV oracle, hand arithmetic, zero/tiny/high rates, boundaries, payoff, principal conservation and invalid input.');

const extended = calculate({amount: 50000000, rate: 20, years: 50});
near(extended.payment.first, oracle(50000000,20,600), 0.0001);
assert.equal(extended.payment.rows.at(-1).balance, 0);

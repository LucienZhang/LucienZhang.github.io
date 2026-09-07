import assert from 'node:assert/strict';
import { formatAmount, amountScale } from '../../docs/.vuepress/components/tools/japan-tax/amount-format.js';
assert.equal(formatAmount('1234567'), '1,234,567');
assert.equal(formatAmount('9007199254740993'), '9,007,199,254,740,993');
assert.equal(formatAmount('0'), '0');
assert.equal(formatAmount('-1'), '-1');
assert.equal(formatAmount('12.5'), '12.5');
assert.equal(amountScale('999999'), '≈ 100万日元');
assert.equal(amountScale('1000000'), '100万日元');
assert.equal(amountScale('10000000'), '1千万日元');
assert.equal(amountScale('100000000'), '1亿日元');
assert.equal(amountScale('0001000000'), '100万日元');
assert.equal(amountScale('bad'), '日元');
assert.equal(amountScale('1000000', false), '1 million JPY');


assert.equal(amountScale('50000000'), '5千万日元');
assert.equal(amountScale('123456789'), '≈ 1.23亿日元');

assert.equal(amountScale('32180123'), '≈ 3.22千万日元');
assert.equal(amountScale('32100000'), '3.21千万日元');
assert.equal(amountScale('32150000'), '≈ 3.22千万日元');
assert.equal(amountScale('32100123'), '≈ 3.21千万日元');
assert.equal(amountScale('32180123', false), '≈ 32.18 million JPY');
console.log('Amount presentation checks passed (19 assertions).');

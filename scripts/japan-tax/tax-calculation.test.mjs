import assert from 'node:assert/strict';
import { employmentIncome, taxOnIncome, calculate } from '../../docs/.vuepress/components/tools/japan-tax/tax-calculation.mjs';
let checks = 0;
const eq = (a,b) => { assert.deepEqual(a,b); checks++; };
for (const [salary, expected] of [[0,0],[650999,0],[651000,1000],[1899999,1249999],[1900000,1250000],[1920500,1264000],[3599999,2437200],[3600000,2440000],[6599999,4836800],[6600000,4840000],[6600001,4840000],[8499999,6549999],[8500000,6550000],[10000000,8050000]]) eq(employmentIncome(BigInt(salary)),BigInt(expected));
for (const [base,rate,tax] of [[0,0,0],[1949000,5,97450],[1950000,10,97500],[3299000,10,232400],[3300000,20,232500],[6949000,20,962300],[6950000,23,962500],[8999000,23,1433770],[9000000,33,1434000],[17999000,33,4403670],[18000000,40,4404000],[39999000,40,13203600],[40000000,45,13204000],[7000000,23,974000]]) { eq(taxOnIncome(BigInt(base)).rate,BigInt(rate)); eq(taxOnIncome(BigInt(base)).tax,BigInt(tax)); }
eq(taxOnIncome(2740000n).reconstruction,3706n); // official base tax176,500 -> surtax3,706
eq(calculate({salary:'10000000',deductions:['1049001']}).taxable,7000000n);
eq(calculate({salary:'10000000',deductions:['1050001']}).taxable,6999000n);
eq(calculate({salary:'10000000',deductions:['1050000']}).reconstruction,20454n);
eq(calculate({salary:'5000000',deductions:['9999999']}).tax,0n);
eq(calculate({salary:'0',deductions:['0']}).tax,0n);
for (const salary of ['', '-1', '1.5', '1e6', '99999999999999999']) eq(calculate({salary,deductions:['0']}).status,'salary');
for (const deductions of [[],[''],['1',''],['-1']]) eq(calculate({salary:'5000000',deductions}).status,'deductions');
eq(calculate({salary:'331950001',deductions:['0']}).status,'range');
eq(calculate({salary:'5000000',deductions:['480000','1000000']}),calculate({salary:'5000000',deductions:['1480000']}));
console.log(`${checks} calculation assertions passed`);

import assert from 'node:assert/strict';
import { parseMortgageQuery, mortgageHref } from '../docs/.vuepress/lib/loan/handoff.mjs';
const input = {amount:50000000,rate:1.5,years:35};
for (const zh of [false,true]) {
 const url = new URL(mortgageHref(input,zh),'https://example.com');
 assert.equal(url.pathname, `${zh ? '/zh' : ''}/tools/mortgage.html`);
 assert.deepEqual(parseMortgageQuery(Object.fromEntries(url.searchParams)),{amount:50000000,rate:1.5,months:420});
}
for (const rate of [0,1e-9,20]) assert.equal(parseMortgageQuery({amount:'1',rate:String(rate),months:'600'}).rate,rate);
for (const patch of [{amount:'0'},{amount:'10000000001'},{amount:['1','2']},{rate:'Infinity'},{rate:'-1'},{rate:'21'},{rate:['1']},{rate:'0x10'},{rate:'1e999'},{rate:null},{months:'0'},{months:'601'},{months:'1.5'},{months:undefined},{amount:'<script>'}]) {
 assert.equal(parseMortgageQuery({amount:'50000000',rate:'1.5',months:'420',...patch}),null);
}
console.log('Loan handoff: locale, defaults, zero/tiny rates, boundaries and malformed query values passed.');

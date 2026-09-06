import assert from 'node:assert/strict';
import { estimateFurusatoLimit } from '../../docs/.vuepress/components/tools/japan-tax/tax-calculation.mjs';
const run = (levy,rate) => estimateFurusatoLimit({status:'ready',rate:BigInt(rate)},{status:'ready',levy:BigInt(levy)});
assert.equal(run(114500,5).amount,28974n); // official municipal example, floored
assert.equal(run(702500,23).amount,213224n);
assert.equal(run(0,23).amount,0n);
assert.equal(run(1000,0).status,'noIncomeTax');
assert.equal(estimateFurusatoLimit({status:'salary'},{status:'ready'}).status,'incomplete');
assert.equal(estimateFurusatoLimit({status:'ready'},{status:'adjustment'}).status,'incomplete');
for(const rate of [5,10,20,23,33,40,45]) {
 const result=run(367500,rate).amount;
 const denominator=90000n-BigInt(rate)*1021n;
 assert.ok((result-2000n)*denominator<=367500n*20000n);
 assert.ok((result-1999n)*denominator>367500n*20000n);
}
console.log('20 estimate assertions passed');

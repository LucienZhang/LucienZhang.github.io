import assert from 'node:assert/strict';
import { calculate, calculateResident, employmentAdjustment, housingRelief, estimateFurusatoLimit } from '../../../docs/.vuepress/components/tools/japan-tax/tax-calculation.mjs';
import { estimateSettlement } from '../../../docs/.vuepress/components/tools/japan-tax/settlement.mjs';
let count=0;
const eq=(a,b)=>{assert.deepEqual(a,b);count++;};
const house={enabled:true,eligible:true,amount:'400000',incomeLimit:'20000000',residentBand:'standard',stage:'continuing'};
const run=(options={})=>{
 const p={salary:'5000000', deductions:['1000000'], adjustment:'2500', incomeAdjustment:false, housing:house, donation:'0', withheld:'100000', method:'return',...options};
 const national=calculate(p);
 const resident=calculateResident(p);
 return {national,resident,settled:estimateSettlement({...p,national,resident})};
};
// Exactly 8.5m is excluded; the next yen must round up, and the 150k cap persists.
eq(employmentAdjustment(8500000n,true),0n);
eq(employmentAdjustment(8500001n,true),1n);
eq(employmentAdjustment(8500010n,true),1n);
eq(employmentAdjustment(8500011n,true),2n);
eq(employmentAdjustment(10000000n,true),150000n);
eq(employmentAdjustment(90000000n,true),150000n);
eq(employmentAdjustment(10000000n,false),0n);
const family=run({salary:'10000000',housing:undefined,incomeAdjustment:true});
eq(family.national.incomeBeforeAdjustment,8050000n);
eq(family.national.income,7900000n);
eq(family.national.taxable,6900000n);
eq(family.national.rate,20n);
eq(family.resident.taxable,6900000n);
eq(family.resident.levy,687500n);
eq(estimateFurusatoLimit(family.national,family.resident).amount,199614n);
// Housing is applied BEFORE reconstruction surtax, not after or as an income deduction.
const partial=run({housing:{...house,amount:'100000'}});
eq(partial.national.taxable,2560000n);
eq(partial.national.taxBeforeHousing,158500n);
eq(partial.national.housingUsed,100000n);
eq(partial.national.tax,58500n);
eq(partial.national.reconstruction,1228n);
eq(partial.settled.national.refund,40272n);
eq(partial.settled.resident.housing,0n);
const full=run();
eq(full.national.tax,0n);
eq(full.national.reconstruction,0n);
eq(full.settled.national.refund,100000n);
eq(full.settled.resident.housing,97500n);
eq(full.settled.resident.municipal.housingCredit,58500n);
eq(full.settled.resident.prefectural.housingCredit,39000n);
eq(full.settled.resident.annual,161000n);
eq(full.settled.resident.june+11n*full.settled.resident.monthly,161000n);
// Percentage cap, enhanced cap, and no resident eligibility are distinct.
eq(housingRelief(5000000n,1000000n,50000n,house).housingResident,50000n);
eq(housingRelief(5000000n,1000000n,50000n,{...house,residentBand:'enhanced'}).housingResident,70000n);
eq(run({housing:{...house,residentBand:'enhanced'}}).settled.resident.housing,136500n);
eq(run({housing:{...house,residentBand:'none'}}).settled.resident.housing,0n);
// Income ceiling uses adjusted employment income, BEFORE ordinary deductions.
for(const ceiling of ['10000000','20000000','30000000']) {
 eq(housingRelief(BigInt(ceiling),1000000n,50000n,{...house,incomeLimit:ceiling}).housingUsed,50000n);
 eq(housingRelief(BigInt(ceiling)+1n,1000000n,50000n,{...house,incomeLimit:ceiling}).housingUsed,0n);
}
eq(run({salary:'22000000',deductions:['10000000']}).national.housingExcluded,true);
eq(run({salary:'22000000',deductions:['10000000'],incomeAdjustment:true}).national.housingExcluded,false);
// A donation can release housing entitlement into resident tax, until its cap.
const base=run({housing:{...house,amount:'200000'}});
const donated=run({housing:{...house,amount:'200000'},donation:'100000'});
eq(base.settled.resident.housing,41500n);
eq(donated.settled.resident.housing,51300n);
eq(donated.settled.national.relief,0n);
eq(donated.settled.national.taxable,2462000n);
// Donation special credit is capped at 253,500 × 20% = 50,700.
eq(run({donation:'100000'}).settled.resident.annual,100500n);
// Housing must not lower the pre-housing 20% special-credit cap.
eq(estimateFurusatoLimit(base.national,base.resident).amount,estimateFurusatoLimit(run({housing:undefined}).national,base.resident).amount);
for(const residentBand of ['standard','enhanced','none']) for(const method of ['return','one-stop']) {
 const x=run({housing:{...house,residentBand},donation:'1000000',method}).settled;
 eq(x.national.status,'ready');
 eq(x.resident.status,'ready');
 for(const c of [x.resident.municipal,x.resident.prefectural]) {
  assert.ok(c.after>=0n && c.housingCredit+c.credit<=c.levy);count++;
 }
 eq(x.resident.june+11n*x.resident.monthly,x.resident.annual);
}
// First claims cannot silently proceed through one-stop or a missing procedure.
eq(run({housing:{...house,stage:'first'},method:'one-stop',donation:'10000'}).settled.national.status,'housingFirstReturn');
eq(run({housing:{...house,stage:'first'},method:''}).settled.national.status,'housingFirstReturn');
eq(run({housing:{...house,stage:'first'},method:'return'}).settled.national.status,'ready');
for(const patch of [{amount:''},{amount:'-1'},{amount:'12345'},{eligible:false},{residentBand:''},{incomeLimit:''},{stage:''}]) {
 const x=run({housing:{...house,...patch}});
 assert.notEqual(x.national.status,'ready');count++;
 assert.notEqual(x.settled.resident.status,'ready');count++;
}
eq(run({housing:{enabled:false,amount:'bad'}}).national.status,'ready');
console.log(`${count} income-adjustment / housing-credit assertions passed`);

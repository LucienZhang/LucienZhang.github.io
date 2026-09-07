import assert from 'node:assert/strict';
import { calculate, calculateResident } from '../../docs/.vuepress/components/tools/japan-tax/tax-calculation.mjs';
import { estimateSettlement, payrollSchedule } from '../../docs/.vuepress/components/tools/japan-tax/settlement.mjs';
let assertions = 0;
const eq = (a,b) => { assert.deepEqual(a,b); assertions++; };
const run = (overrides = {}) => {
  const p = {salary:'10000000', deductions:['1050000'], residentDeductions:['1000000'], adjustment:'2500', withheld:'1000000', donation:'100000', method:'return', ...overrides};
  return estimateSettlement({...p, national:calculate({salary:p.salary,deductions:p.deductions}), resident:calculateResident({salary:p.salary,deductions:p.residentDeductions,adjustment:p.adjustment})});
};
// Crossing 6.95m: recomputation uses the new 20% band, not donation * old 23%.
const returned = run();
eq(returned.national.taxable,6902000n);
eq(returned.national.rate,20n);
eq(returned.national.tax,952900n);
eq(returned.national.reconstruction,20010n);
eq(returned.national.refund,27090n);
eq(returned.national.relief,21544n);
eq(returned.resident.basic,9800n);
eq(returned.resident.special,65187n);
eq(returned.resident.annual,632500n);
eq(returned.resident.june,52800n);
eq(returned.resident.monthly,52700n);
const stopped = run({method:'one-stop'});
eq(stopped.national.refund,0n);
eq(stopped.national.deduction,0n);
eq(stopped.resident.additional,23015n);
eq(stopped.resident.annual,609300n);
eq(stopped.resident.june,51600n);
eq(stopped.resident.monthly,50700n);
// Urasoe's worked resident-credit example: 2.072m taxable, 2,500 adjustment,
// 100,000 donation and the stipulated resident special-credit rate of 10%.
// Its actual national rate differs; here national deductions select the proxy 10%.
const official = run({salary:'5000000',deductions:['1488000'],residentDeductions:['1488000']});
eq(official.resident.municipal.basic,5880n);
eq(official.resident.prefectural.basic,3920n);
eq(official.resident.municipal.special,24564n);
eq(official.resident.prefectural.special,16376n);
eq(official.resident.municipal.credit,30444n);
eq(official.resident.prefectural.credit,20296n);
// June takes the remainder, including the official Mihama 60,200 example.
eq(payrollSchedule(60200n),{annual:60200n,june:5200n,monthly:5000n});
eq(payrollSchedule(5000n),{annual:5000n,june:5000n,monthly:0n});
eq(payrollSchedule(0n),{annual:0n,june:0n,monthly:0n});
eq(payrollSchedule(5100n),{annual:5100n,june:700n,monthly:400n});
for(const donation of ['0','1999','2000']) {
 const r=run({donation,method:''});
 // Nonzero donations still require a claim method, even below the deductible floor.
 if (donation!=='0') { eq(r.national.status,'method'); continue; }
 eq(r.national.refund,5546n); eq(r.resident.annual,707500n);
}
for(const donation of ['1999','2000']) { eq(run({donation}).national.refund,5546n); eq(run({donation}).resident.credit,0n); }
eq(run({withheld:'972911'}).national.refund,1n); // no ¥100 truncation for refunds
// Tax due does truncate, after subtracting withholding.
eq(run({withheld:'972811'}).national.due,0n);
eq(run({withheld:'972810'}).national.due,100n);
eq(run({withheld:'0'}).national.refund,0n);
eq(run({withheld:'0'}).national.due,972900n);
const capped=run({donation:'9999999999999999'});
eq(capped.national.deduction,3218000n); // 8,050,000 * 40% - 2,000
// Resident basic donation cap is 30%, special credit is 20% per tax component.
eq(capped.resident.basic,241300n);
eq(capped.resident.special,140500n);
for(const donation of ['', '-1', '1.5', '1e6', '10000000000000000']) { eq(run({donation}).national.status,'donation'); eq(run({donation}).resident.status,'donation'); }
eq(run({method:''}).resident.status,'method');
eq(run({salary:''}).national.status,'inputs');
eq(run({withheld:''}).national.status,'withheld');
eq(run({withheld:''}).resident.status,'ready'); // independent resident output
// A source withholding amount isn't needed for one-stop's zero donation refund.
eq(run({method:'one-stop',withheld:''}).national.refund,0n);
eq(run({adjustment:''}).resident.status,'inputs');
eq(run({adjustment:''}).national.status,'ready');
eq(run({method:'one-stop',salary:'20000001'}).national.status,'oneStopIneligible');
eq(run({salary:'0',donation:'0',withheld:'0',adjustment:'0'}).resident.status,'exemption');
eq(run({deductions:['99999999']}).resident.status,'rate');
eq(run({deductions:['99999999']}).national.refund,1000000n);
for (const method of ['return','one-stop']) for (const donation of ['0','2001','213224','500000','9000000']) {
 const r=run({method,donation}).resident;
 eq(r.june+r.monthly*11n,r.annual);
 eq(r.annual%100n,0n);
 assert.ok(r.municipal.credit<=r.municipal.levy && r.prefectural.credit<=r.prefectural.levy); assertions++;
}
eq(run({hasOtherDonations:true}).national.status,'otherDonations');
eq(run({hasOtherDonations:true,method:'one-stop'}).resident.status,'otherDonations');
eq(run({hasOtherDonations:true,donation:'0'}).national.status,'ready');
eq(run({hasOtherDonations:true,donation:'0'}).resident.status,'otherDonations');
console.log(`${assertions} settlement assertions passed`);

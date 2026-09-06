import { validStart, calendarMonth, periodAt } from '../docs/.vuepress/components/tools/mortgage/calendar.mjs';
import assert from 'node:assert/strict';
import { compare, defaults, crossings, metricPoints } from '../docs/.vuepress/components/tools/mortgage/model.mjs';
const near = (a,b,t=0.001) => assert.ok(Math.abs(a-b)<t, `${a} != ${b}`);
// Independent closed-form reference; stable prototype + nonannual PV extension checked together.
for (const amount of [1, 50000000, 1e10]) for (const rate of [0, 1e-8, 1.5, 20]) for (const months of [1, 2, 12, 13, 359, 360, 479, 480, 599, 600]) {
  const result = compare({amount,a:{method:'payment',rate,months},b:{method:'principal',rate,months}});
  const r=rate/1200;
  const payment = r ? amount*r/-Math.expm1(-months*Math.log1p(r)) : amount/months;
  near(result.rows[1].a.payment,payment);
  near(result.rows.at(-1).a.cumulative,payment*months-amount,0.1);
  near(result.rows.at(-1).b.cumulative,amount*r*(months+1)/2,0.1);
  for (const id of ['a','b']) {
    let principal=0;
    for (const row of result.rows) {
      const p=row[id]; principal+=p.principal;
      near(p.paid+p.balance-amount,p.cumulative,0.1);
      assert.ok(p.balance>=0 && p.interest>=0 && p.principal>=0);
      near(p.payment,p.interest+p.principal);
      const m=row.month;
      const balance=id==='b' ? amount*(1-m/months) : r===0 ? amount*(1-m/months) : amount*Math.exp(m*Math.log1p(r))*Math.expm1((months-m)*Math.log1p(r))/Math.expm1(months*Math.log1p(r));
      near(p.balance,balance,0.1);
      if(id==='a') near(p.cumulative,payment*m-amount+balance,0.1);
    }
    near(principal,amount,0.1); assert.equal(result.rows.at(-1)[id].balance,0);
  }
}
assert.equal(defaults.a.months,420); assert.equal(defaults.b.months,420);
const result=compare({...defaults,a:{...defaults.a,months:360},b:{...defaults.b,months:360}});
near(result.rows[1].a.payment,172560.10522881633);
near(result.rows.at(-1).a.cumulative,12121637.882373877);
near(result.rows.at(-1).b.cumulative,11281250);
const crossing=crossings(metricPoints(result,'payment'));
assert.equal(crossing.flips[0].first,168); near(crossing.flips[0].month,167.053793882,1e-6);
assert.ok(result.rows[167].a.payment<result.rows[167].b.payment);
assert.ok(result.rows[168].a.payment>result.rows[168].b.payment);
assert.equal(crossings(metricPoints(result,'cumulative',0)).flips.length,0);
assert.deepEqual(crossings(metricPoints(result,'cumulative',0)).equal,[0,1]);
for (const values of [[0,0,0],[-1,0,1],[-1,1,-1],[0,1,2],[1,1,1]]) {
  const c=crossings(values.map((value,month)=>({value,month})));
  if(values.every(v=>v===0)) assert.equal(c.coincident,true);
  if(values.join() === '-1,0,1') { assert.equal(c.flips[0].month,1); assert.equal(c.flips[0].first,2); }
  if(values.join() === '-1,1,-1') assert.equal(c.flips.length,2);
}
const unequal=compare({...defaults,b:{method:'payment',rate:1.5,months:12}});
assert.equal(unequal.rows[13].b.payment,0);assert.equal(unequal.rows[13].b.balance,0);assert.equal(unequal.rows[13].b.cumulative,unequal.rows[12].b.cumulative);
for(const [key,values] of Object.entries({amount:[0,-1,1.1,1e10+1,'',NaN,Infinity]})) for(const value of values) assert.throws(()=>compare({...defaults,[key]:value}),RangeError);
for(const [key,values] of Object.entries({rate:[-1,21,'',NaN,Infinity],months:[0,601,1.5,'',NaN],method:['x','']})) for(const value of values) assert.throws(()=>compare({...defaults,a:{...defaults.a,[key]:value}}),RangeError);
console.log('PASS: 120 boundary scenarios, independent closed forms, conservation, payoff, 167/168 crossing, equality/flip distinctions, invalid input and term extension.');

assert.equal(calendarMonth('2024-12', 0), '2024-11');
assert.equal(calendarMonth('2024-12', 1), '2024-12');
assert.equal(calendarMonth('2024-12', 2), '2025-01');
assert.equal(calendarMonth('2024-12', 600), '2074-11');
for(const invalid of ['', '2024-13', '1899-12', '2201-01']) assert.equal(validStart(invalid),false);
console.log('Calendar offsets and validation passed.');

for (const m of [0,1,2,420,600]) assert.equal(periodAt('2026-09',calendarMonth('2026-09',m)),m);
assert.ok(Number.isNaN(periodAt('2026-09','')));

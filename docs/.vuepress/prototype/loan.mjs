import { fixedSchedules } from './fixed-schedules.mjs';
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
  return { input: { ...input }, months, ...fixedSchedules({ amount, rate, months }) };
}

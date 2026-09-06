import { fixedSchedules } from './fixed-schedules.mjs';
// Fixed nominal annual rate, monthly periods. See .ai/phase5/homepage-design-spec.md.
export const defaults = Object.freeze({ amount: 50000000, rate: 1.5, years: 35 });

export function validate(input) {
  return {
    amount: !(Number.isInteger(input.amount) && input.amount >= 1 && input.amount <= 10000000000),
    rate: !(typeof input.rate === 'number' && Number.isFinite(input.rate) && input.rate >= 0 && input.rate <= 20),
    years: !(Number.isInteger(input.years) && input.years >= 1 && input.years <= 50),
  };
}

export function calculate(input) {
  if (Object.values(validate(input)).some(Boolean)) throw new RangeError('Invalid loan input');
  const { amount, rate, years } = input;
  const months = years * 12;
  return { input: { ...input }, months, ...fixedSchedules({ amount, rate, months }) };
}

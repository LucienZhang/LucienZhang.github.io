// Only a complete, bounded scalar tuple may initialize the full tool.
export function parseMortgageQuery(query) {
  const { amount, rate, months } = query;
  if (typeof amount !== 'string' || !/^\d{1,11}$/.test(amount)
    || typeof rate !== 'string' || rate.length > 32 || !/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(rate)
    || typeof months !== 'string' || !/^\d{1,3}$/.test(months)) return null;
  const values = { amount: Number(amount), rate: Number(rate), months: Number(months) };
  if (values.amount < 1 || values.amount > 1e10 || !Number.isFinite(values.rate) || values.rate < 0 || values.rate > 20 || values.months < 1 || values.months > 600) return null;
  return values;
}
export function mortgageHref(input, zh = false) {
  return `${zh ? '/zh' : ''}/tools/mortgage.html?${new URLSearchParams({amount: String(input.amount), rate: String(input.rate), months: String(input.years * 12)})}`;
}

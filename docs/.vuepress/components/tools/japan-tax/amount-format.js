// Presentation only: retain exact integer strings rather than converting money to Number.
export function formatAmount(raw = '') {
  return /^\d+$/.test(raw) ? raw.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : raw;
}
export function amountScale(raw = '', zh = true) {
  if (!/^\d+$/.test(raw)) return zh ? '日元' : 'JPY';
  const digits = raw.replace(/^0+/, '') || '0';
  const units = zh ? [[8, '亿'], [7, '千万'], [4, '万']] : [[9, ' billion'], [6, ' million'], [3, ' thousand']];
  const unit = units.find(([places]) => digits.length > places);
  if (!unit) return formatAmount(digits) + (zh ? ' 日元' : ' JPY');
  const [places, name] = unit;
  // Round the hint to two decimals using integers; the entered yen stay exact.
  const divisor = 10n ** BigInt(places);
  const amount = BigInt(digits);
  const hundredths = (amount * 100n + divisor / 2n) / divisor;
  const fraction = String(hundredths % 100n).padStart(2, '0').replace(/0+$/, '');
  const displayed = formatAmount(String(hundredths / 100n)) + (fraction ? '.' + fraction : '');
  return (amount * 100n % divisor !== 0n ? '≈ ' : '') + displayed + name + (zh ? '日元' : ' JPY');
}

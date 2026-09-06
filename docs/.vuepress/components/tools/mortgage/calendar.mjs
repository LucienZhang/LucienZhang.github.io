// Month 1 is the first repayment month; month 0 is the preceding opening position.
export function validStart(value) {
  return typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) && Number(value.slice(0,4)) >= 1900 && Number(value.slice(0,4)) <= 2200;
}
export function calendarMonth(start, month) {
  const [year, m] = start.split('-').map(Number);
  const index = year * 12 + m - 1 + month - 1;
  return `${Math.floor(index / 12)}-${String(index % 12 + 1).padStart(2,'0')}`;
}
export function periodAt(start, value) {
  if (typeof value !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return NaN;
  const [sy, sm] = start.split('-').map(Number);
  const [y, m] = value.split('-').map(Number);
  return (y - sy) * 12 + m - sm + 1;
}

import Decimal from 'decimal.js';
// Format persisted decimal strings without first rounding them through a JavaScript number.
export function formatDecimal(value: string | number, places = 2, locale?: string): string {
  const decimal = new Decimal(value),
    fixed = decimal.abs().toFixed(places),
    [whole, fraction] = fixed.split('.');
  const formatter = new Intl.NumberFormat(locale),
    separator = formatter.formatToParts(1.1).find(p => p.type === 'decimal')?.value ?? '.';
  return `${decimal.isNeg() ? '-' : ''}${formatter.format(BigInt(whole))}${fraction !== undefined ? separator + fraction : ''}`;
}

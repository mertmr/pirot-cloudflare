import Decimal from 'decimal.js';
import type { IUrun } from 'app/shared/model/urun.model';
export const SaleDecimal = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP, toExpNeg: -40, toExpPos: 40 });
export function quarterMoney(value: Decimal.Value): string {
  return new SaleDecimal(value).times(4).toDecimalPlaces(0).div(4).toFixed(2);
}
export function calculateSaleLine(product?: IUrun, quantity = 0): string {
  return quarterMoney(new SaleDecimal(product?.musteriFiyati ?? 0).times(quantity).div(product?.birim === 'GRAM' ? 1000 : 1));
}

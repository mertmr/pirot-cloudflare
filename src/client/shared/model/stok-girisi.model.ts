import { StokHareketiTipi } from 'app/shared/model/enumerations/stok-hareketi-tipi.model';
import { IUrun } from 'app/shared/model/urun.model';
import { IUser } from 'app/shared/model/user.model';

export interface IStokGirisi {
  id?: number;
  miktar?: number;
  agirlik?: number | null;
  notlar?: string;
  stokHareketiTipi?: keyof typeof StokHareketiTipi;
  tarih?: string | null;
  user?: IUser | string | null;
  urun?: IUrun | null;

  /**
   * Flat fields populated only by the list/search endpoints (api/stok-girisis,
   * api/searchStokGirisiByUrun), which return StokGirisiDto with the product
   * name denormalized instead of the nested urun entity.
   */
  urunAdi?: string | null;
}

export const defaultValue: Readonly<IStokGirisi> = {};

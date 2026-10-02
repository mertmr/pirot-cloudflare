import { IUretici } from 'app/shared/model/uretici.model';

export interface IUreticiOdemeleri {
  id?: number;
  tutar?: number | string | null;
  sonGuncellenmeTarihi?: string | null;
  uretici?: IUretici | null;
}

export const defaultValue: Readonly<IUreticiOdemeleri> = {};

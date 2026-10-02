import { HareketTipi } from 'app/shared/model/enumerations/hareket-tipi.model';
import { OdemeAraci } from 'app/shared/model/enumerations/odeme-araci.model';
import { ISatis } from 'app/shared/model/satis.model';
import { IUrun } from 'app/shared/model/urun.model';
import { IUser } from 'app/shared/model/user.model';

export interface IBorcAlacak {
  id?: number;
  tutar?: number | string | null;
  notlar?: string | null;
  odemeAraci?: keyof typeof OdemeAraci | null;
  hareketTipi?: keyof typeof HareketTipi | null;
  tarih?: string | null;
  user?: IUser | null;
  urun?: IUrun | null;
  satis?: ISatis | null;
}

export const defaultValue: Readonly<IBorcAlacak> = {};

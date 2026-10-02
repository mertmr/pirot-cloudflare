import { IUrun } from 'app/shared/model/urun.model';
import { IUser } from 'app/shared/model/user.model';

export interface IUrunFiyat {
  id?: number;
  fiyat?: number | string | null;
  tarih?: string | null;
  user?: IUser | null;
  urun?: IUrun | null;
}

export const defaultValue: Readonly<IUrunFiyat> = {};

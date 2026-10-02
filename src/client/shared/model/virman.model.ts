import { Hesap } from 'app/shared/model/enumerations/hesap.model';
import { IUser } from 'app/shared/model/user.model';

import { IDuzeltmeTalebi } from './nobet-duzeltme.model';

export interface IVirman {
  duzeltildi?: boolean;
  iptal?: boolean;
  nobetAcilisId?: number;
  duzeltme?: IDuzeltmeTalebi;
  id?: number;
  tutar?: number | string;
  notlar?: string;
  cikisHesabi?: keyof typeof Hesap | null;
  girisHesabi?: keyof typeof Hesap | null;
  tarih?: string | null;
  user?: IUser | null;
}

export const defaultValue: Readonly<IVirman> = {};

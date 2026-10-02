import { GiderTipi } from 'app/shared/model/enumerations/gider-tipi.model';
import { OdemeAraci } from 'app/shared/model/enumerations/odeme-araci.model';
import { IUser } from 'app/shared/model/user.model';

import { IDuzeltmeTalebi } from './nobet-duzeltme.model';

export interface IGider {
  duzeltildi?: boolean;
  iptal?: boolean;
  nobetAcilisId?: number;
  duzeltme?: IDuzeltmeTalebi;
  id?: number;
  tarih?: string | null;
  tutar?: number | string;
  notlar?: string;
  giderTipi?: keyof typeof GiderTipi;
  odemeAraci?: keyof typeof OdemeAraci;
  user?: IUser | null;
}

export const defaultValue: Readonly<IGider> = {};

import { AcilisKapanis } from 'app/shared/model/enumerations/acilis-kapanis.model';
import { IUser } from 'app/shared/model/user.model';

export interface INobetHareketleri {
  acilisId?: number;
  kapanisDokumu?: string;
  id?: number;
  kasa?: number | string | null;
  pirot?: number | string | null;
  fark?: number | string | null;
  farkDenge?: number | string | null;
  nobetSuresi?: number | string | null;
  notlar?: string | null;
  acilisKapanis?: keyof typeof AcilisKapanis | null;
  tarih?: string | null;
  user?: IUser | null;
}

export const defaultValue: Readonly<INobetHareketleri> = {};

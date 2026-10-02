import { Birim } from 'app/shared/model/enumerations/birim.model';
import { UrunKategorisi } from 'app/shared/model/enumerations/urun-kategorisi.model';
import { IKdvKategorisi } from 'app/shared/model/kdv-kategorisi.model';
import { IUser } from 'app/shared/model/user.model';

export interface IUrun {
  id?: number;
  urunAdi?: string;
  stok?: number | string | null;
  stokSiniri?: number | string | null;
  musteriFiyati?: number | string | null;
  birim?: keyof typeof Birim;
  dayanismaUrunu?: boolean | null;
  satista?: boolean | null;
  urunKategorisi?: keyof typeof UrunKategorisi | null;
  active?: boolean | null;
  urunSorumlusu?: IUser | null;
  kdvKategorisi?: IKdvKategorisi | null;
}

export const defaultValue: Readonly<IUrun> = {
  dayanismaUrunu: false,
  satista: false,
  active: false,
};

import { ISatis } from 'app/shared/model/satis.model';
import { IUrun } from 'app/shared/model/urun.model';

export interface ISatisStokHareketleri {
  id?: number;
  miktar?: number;
  tutar?: number | string;
  agirlikAta?: number;
  urun?: IUrun;
  satis?: ISatis;
}

export const defaultValue: Readonly<ISatisStokHareketleri> = {};

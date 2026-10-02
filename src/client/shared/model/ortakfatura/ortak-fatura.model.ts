import { IOrtakFaturaDetay } from 'app/shared/model/ortakfatura/ortak-fatura-detay.model';
import { IKdvToplam } from 'app/shared/model/ortakfatura/kdv-toplam.model';

export interface IOrtakFatura {
  tumKdvToplami?: number;
  tumToplamKdvHaric?: number;
  tumToplam?: number;
  ortakFaturasiDetayDto?: readonly IOrtakFaturaDetay[];
  kdvToplamList?: readonly IKdvToplam[];
}

export const defaultValue: Readonly<IOrtakFatura> = {};

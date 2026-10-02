export interface IKasaHareketleri {
  id?: number;
  kasaMiktar?: number | string | null;
  hareket?: string | null;
  tarih?: string | null;
}

export const defaultValue: Readonly<IKasaHareketleri> = {};

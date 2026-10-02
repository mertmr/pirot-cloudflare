export interface IFiyat {
  agirlikAta?: number;
  urunId?: number;
  urunAdi?: string;
  eskiFiyat?: number | string;
  yeniFiyat?: number;
  miktar?: number;
  tutar?: number | string;
}

export const defaultValue: IFiyat = {};
export const defaultValueList: IFiyat[] = [];

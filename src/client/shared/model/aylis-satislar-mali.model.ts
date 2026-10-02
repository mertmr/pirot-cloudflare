export interface IAylikSatislarMali {
  aylikSatisMap?: Record<string, number | string>;
  tarihListesi?: string[];
  urunAdiListesi?: string[];
}

export const defaultValue: Readonly<IAylikSatislarMali> = {};

export interface IStokGirisiUrun {
  stokGirisiId?: number;
  miktar?: number;
  stokGirisiTarihi?: string;
  stokGirisAciklamasi?: string;
}

export const defaultValueStokGirisiUrun: Readonly<IStokGirisiUrun> = {};

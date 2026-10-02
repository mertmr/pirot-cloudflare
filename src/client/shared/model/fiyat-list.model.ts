import { IFiyat } from 'app/shared/model/fiyat.model';

export interface IFiyatDTO {
  fiyatHesapDTOList?: IFiyat[];
}

export const defaultValue: IFiyatDTO = {};

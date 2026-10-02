export interface IDuzeltmeTalebi {
  neden: string;
  nakitSimdi: boolean;
}
export interface INobetDuzeltme {
  id: number;
  kaynakTipi: 'satis' | 'gider' | 'virman';
  kaynakId: number;
  kapanisId: number;
  nobetAcilisId: number;
  neden: string;
  islem: string;
  kullanici: string;
  tarih: string;
  onceki: string;
  sonraki: string;
  kasaDegisimi: number;
  bekleyenKasa: number;
  nakitSimdi: boolean;
  odemeTarihi?: string;
  odemeNobetId?: number;
  odemeKullanici?: string;
}
export interface ICorrectionContext {
  kapanisId?: number;
  iptal: boolean;
  duzeltmeler: INobetDuzeltme[];
}

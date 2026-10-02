import { IBorcAlacak } from 'app/shared/model/borc-alacak.model';

/** A debt can be collected only while it is an unpaid "pay later" debt linked to a sale. */
export const isCollectableBorc = (borcAlacak: IBorcAlacak): boolean =>
  borcAlacak.odemeAraci === 'SONRA_ODEME' && borcAlacak.hareketTipi === 'BORC' && borcAlacak.satis != null;

import borcAlacak from 'app/entities/borc-alacak/borc-alacak.reducer';
import gider from 'app/entities/gider/gider.reducer';
import kasaHareketleri from 'app/entities/kasa-hareketleri/kasa-hareketleri.reducer';
import kdvKategorisi from 'app/entities/kdv-kategorisi/kdv-kategorisi.reducer';
import kisiler from 'app/entities/kisiler/kisiler.reducer';
import nobetHareketleri from 'app/entities/nobet-hareketleri/nobet-hareketleri.reducer';
import satis from 'app/entities/satis/satis.reducer';
import satisStokHareketleri from 'app/entities/satis-stok-hareketleri/satis-stok-hareketleri.reducer';
import stokGirisi from 'app/entities/stok-girisi/stok-girisi.reducer';
import uretici from 'app/entities/uretici/uretici.reducer';
import ureticiOdemeleri from 'app/entities/uretici-odemeleri/uretici-odemeleri.reducer';
import urun from 'app/entities/urun/urun.reducer';
import urunFiyat from 'app/entities/urun-fiyat/urun-fiyat.reducer';
import urunFiyatHesap from 'app/entities/urun-fiyat-hesap/urun-fiyat-hesap.reducer';
import virman from 'app/entities/virman/virman.reducer';
/* jhipster-needle-add-reducer-import - JHipster will add reducer here */

const entitiesReducers = {
  gider,
  kdvKategorisi,
  satis,
  satisStokHareketleri,
  stokGirisi,
  uretici,
  urun,
  urunFiyat,
  virman,
  borcAlacak,
  kasaHareketleri,
  nobetHareketleri,
  kisiler,
  urunFiyatHesap,
  ureticiOdemeleri,
  // jhipster-needle-add-reducer-combine - JHipster will add reducer here
};

export default entitiesReducers;

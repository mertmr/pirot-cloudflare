// Contracts extracted from the customized Java entities, reviewed by the Cloudflare services.
export const ENTITY_SPECS = {
  uruns: {
    name: 'Urun',
    fields: {
      urunAdi: {
        type: 'string',
        required: true,
      },
      stok: {
        type: 'decimal',
        required: false,
      },
      stokSiniri: {
        type: 'decimal',
        required: false,
      },
      musteriFiyati: {
        type: 'decimal',
        required: false,
      },
      birim: {
        type: 'enum',
        required: true,
        values: ['ADET', 'GRAM'],
      },
      dayanismaUrunu: {
        type: 'boolean',
        required: false,
      },
      satista: {
        type: 'boolean',
        required: false,
      },
      urunKategorisi: {
        type: 'enum',
        required: false,
        values: ['GIDA', 'GIDA_DISI'],
      },
      active: {
        type: 'boolean',
        required: false,
      },
      uretici: {
        type: 'relation',
        required: false,
        target: 'ureticis',
      },
      urunSorumlusu: {
        type: 'relation',
        required: false,
        target: 'users',
      },
      kdvKategorisi: {
        type: 'relation',
        required: false,
        target: 'kdv-kategorisis',
      },
      urunFiyatHesap: {
        type: 'relation',
        required: false,
        target: 'urun-fiyat-hesaps',
      },
    },
  },
  ureticis: {
    name: 'Uretici',
    fields: {
      adi: {
        type: 'string',
        required: true,
      },
      adres: {
        type: 'string',
        required: false,
      },
      bankaBilgileri: {
        type: 'string',
        required: true,
      },
      tarih: {
        type: 'date',
        required: false,
      },
      user: {
        type: 'relation',
        required: false,
        target: 'users',
      },
    },
  },
  'kdv-kategorisis': {
    name: 'KdvKategorisi',
    fields: {
      kategoriAdi: {
        type: 'string',
        required: true,
      },
      kdvOrani: {
        type: 'integer',
        required: true,
      },
    },
  },
  'urun-fiyats': {
    name: 'UrunFiyat',
    fields: {
      fiyat: {
        type: 'decimal',
        required: false,
      },
      tarih: {
        type: 'date',
        required: false,
      },
      user: {
        type: 'relation',
        required: false,
        target: 'users',
      },
      urun: {
        type: 'relation',
        required: false,
        target: 'uruns',
      },
    },
  },
  'urun-fiyat-hesaps': {
    name: 'UrunFiyatHesap',
    fields: {
      faturaTipi: {
        type: 'enum',
        required: false,
        values: ['FATURA', 'GIDER', 'MUSTAHSIL'],
      },
      amortisman: {
        type: 'integer',
        required: false,
      },
      giderPusulaMustahsil: {
        type: 'integer',
        required: false,
      },
      dukkanGider: {
        type: 'integer',
        required: false,
      },
      kooperatifCalisma: {
        type: 'integer',
        required: false,
      },
      dayanisma: {
        type: 'integer',
        required: false,
      },
      fire: {
        type: 'integer',
        required: false,
      },
      urun: {
        type: 'relation',
        required: false,
        target: 'uruns',
      },
    },
  },
  kisilers: {
    name: 'Kisiler',
    fields: {
      kisiAdi: {
        type: 'string',
        required: false,
      },
      notlar: {
        type: 'string',
        required: false,
      },
      tarih: {
        type: 'date',
        required: false,
      },
      active: {
        type: 'boolean',
        required: false,
      },
    },
  },
  satis: {
    name: 'Satis',
    fields: {
      tarih: {
        type: 'date',
        required: false,
      },
      toplamTutar: {
        type: 'decimal',
        required: false,
      },
      ortagaSatis: {
        type: 'boolean',
        required: false,
      },
      kartliSatis: {
        type: 'boolean',
        required: false,
      },
      sonraOdeme: {
        type: 'boolean',
        required: false,
      },
      odendi: {
        type: 'boolean',
        required: false,
      },
      user: {
        type: 'relation',
        required: false,
        target: 'users',
      },
      kisi: {
        type: 'relation',
        required: false,
        target: 'kisilers',
      },
      borcAlacak: {
        type: 'relation',
        required: false,
        target: 'borc-alacaks',
      },
      iptal: {
        type: 'boolean',
        required: false,
      },
      nobetAcilisId: {
        type: 'integer',
        required: false,
      },
      duzeltildi: {
        type: 'boolean',
        required: false,
      },
    },
  },
  'satis-stok-hareketleris': {
    name: 'SatisStokHareketleri',
    fields: {
      miktar: {
        type: 'integer',
        required: true,
      },
      tutar: {
        type: 'decimal',
        required: true,
      },
      urun: {
        type: 'relation',
        required: false,
        target: 'uruns',
      },
      satis: {
        type: 'relation',
        required: false,
        target: 'satis',
      },
    },
  },
  'stok-girisis': {
    name: 'StokGirisi',
    fields: {
      miktar: {
        type: 'integer',
        required: true,
      },
      agirlik: {
        type: 'integer',
        required: false,
      },
      notlar: {
        type: 'string',
        required: true,
      },
      stokHareketiTipi: {
        type: 'enum',
        required: true,
        values: ['STOK_GIRISI', 'FIRE', 'STOK_DUZELTME', 'MASRAF', 'IADE', 'ERZAK_DESTEGI'],
      },
      tarih: {
        type: 'date',
        required: false,
      },
      user: {
        type: 'relation',
        required: false,
        target: 'users',
      },
      urun: {
        type: 'relation',
        required: false,
        target: 'uruns',
      },
    },
  },
  giders: {
    name: 'Gider',
    fields: {
      tarih: {
        type: 'date',
        required: false,
      },
      tutar: {
        type: 'decimal',
        required: true,
      },
      notlar: {
        type: 'string',
        required: true,
      },
      giderTipi: {
        type: 'enum',
        required: true,
        values: ['KARGO', 'SU', 'DIGER', 'VERGI', 'KIRA', 'AIDAT', 'TAKSI', 'ELEKTRIK'],
      },
      odemeAraci: {
        type: 'enum',
        required: true,
        values: ['NAKIT', 'BANKA', 'SONRA_ODEME'],
      },
      user: {
        type: 'relation',
        required: false,
        target: 'users',
      },
      iptal: {
        type: 'boolean',
        required: false,
      },
      nobetAcilisId: {
        type: 'integer',
        required: false,
      },
      duzeltildi: {
        type: 'boolean',
        required: false,
      },
    },
  },
  virmen: {
    name: 'Virman',
    fields: {
      tutar: {
        type: 'decimal',
        required: true,
      },
      notlar: {
        type: 'string',
        required: true,
      },
      cikisHesabi: {
        type: 'enum',
        required: false,
        values: ['KASA', 'BANKA'],
      },
      girisHesabi: {
        type: 'enum',
        required: false,
        values: ['KASA', 'BANKA'],
      },
      tarih: {
        type: 'date',
        required: false,
      },
      user: {
        type: 'relation',
        required: false,
        target: 'users',
      },
      iptal: {
        type: 'boolean',
        required: false,
      },
      nobetAcilisId: {
        type: 'integer',
        required: false,
      },
      duzeltildi: {
        type: 'boolean',
        required: false,
      },
    },
  },
  'borc-alacaks': {
    name: 'BorcAlacak',
    fields: {
      tutar: {
        type: 'decimal',
        required: false,
      },
      notlar: {
        type: 'string',
        required: false,
      },
      odemeAraci: {
        type: 'enum',
        required: false,
        values: ['NAKIT', 'BANKA', 'SONRA_ODEME'],
      },
      hareketTipi: {
        type: 'enum',
        required: false,
        values: ['IPTAL', 'URUN_GIRISI', 'ODEME', 'BORC'],
      },
      tarih: {
        type: 'date',
        required: false,
      },
      user: {
        type: 'relation',
        required: false,
        target: 'users',
      },
      urun: {
        type: 'relation',
        required: false,
        target: 'uruns',
      },
      satis: {
        type: 'relation',
        required: false,
        target: 'satis',
      },
    },
  },
  'kasa-hareketleris': {
    name: 'KasaHareketleri',
    fields: {
      kasaMiktar: {
        type: 'decimal',
        required: false,
      },
      hareket: {
        type: 'string',
        required: false,
      },
      degisimTutari: {
        type: 'decimal',
        required: false,
      },
      hareketTipi: {
        type: 'enum',
        required: false,
        values: ['SATIS', 'TAHSILAT', 'GIDER', 'VIRMAN', 'IADE', 'DIGER'],
      },
      tarih: {
        type: 'date',
        required: false,
      },
      duzeltmeId: {
        type: 'integer',
        required: false,
      },
    },
  },
  'nobet-hareketleris': {
    name: 'NobetHareketleri',
    fields: {
      kasa: {
        type: 'decimal',
        required: false,
      },
      pirot: {
        type: 'decimal',
        required: false,
      },
      fark: {
        type: 'decimal',
        required: false,
      },
      farkDenge: {
        type: 'decimal',
        required: false,
      },
      nobetSuresi: {
        type: 'decimal',
        required: false,
      },
      notlar: {
        type: 'string',
        required: false,
      },
      acilisKapanis: {
        type: 'enum',
        required: false,
        values: ['ACILIS', 'KAPANIS'],
      },
      tarih: {
        type: 'date',
        required: false,
      },
      user: {
        type: 'relation',
        required: false,
        target: 'users',
      },
      acilisId: {
        type: 'integer',
        required: false,
      },
      kapanisDokumu: {
        type: 'string',
        required: false,
      },
    },
  },
  'uretici-odemeleris': {
    name: 'UreticiOdemeleri',
    fields: {
      tutar: {
        type: 'decimal',
        required: false,
      },
      sonGuncellenmeTarihi: {
        type: 'date',
        required: false,
      },
      uretici: {
        type: 'relation',
        required: false,
        target: 'ureticis',
      },
    },
  },
  'nobet-duzeltmeler': {
    name: 'NobetDuzeltme',
    fields: {
      odemeKullanici: {
        type: 'string',
        required: false,
      },
      kaynakTipi: {
        type: 'string',
        required: false,
      },
      kaynakId: {
        type: 'integer',
        required: false,
      },
      kapanisId: {
        type: 'integer',
        required: false,
      },
      nobetAcilisId: {
        type: 'integer',
        required: false,
      },
      neden: {
        type: 'string',
        required: false,
      },
      islem: {
        type: 'string',
        required: false,
      },
      kullanici: {
        type: 'string',
        required: false,
      },
      tarih: {
        type: 'date',
        required: false,
      },
      onceki: {
        type: 'string',
        required: false,
      },
      sonraki: {
        type: 'string',
        required: false,
      },
      kasaDegisimi: {
        type: 'decimal',
        required: false,
      },
      bekleyenKasa: {
        type: 'decimal',
        required: false,
      },
      nakitSimdi: {
        type: 'boolean',
        required: false,
      },
      odemeTarihi: {
        type: 'date',
        required: false,
      },
      odemeNobetId: {
        type: 'integer',
        required: false,
      },
    },
  },
} as const;
export type EntityKind = keyof typeof ENTITY_SPECS;

import React, { useEffect, useState } from 'react';
import Table from 'react-bootstrap/Table';
import { useParams } from 'app/shared/routing/navigation';
import axios from 'axios';

import { IOrtakFatura, defaultValue } from 'app/shared/model/ortakfatura/ortak-fatura.model';

export const OrtakFaturaDetail = () => {
  const { id } = useParams<'id'>();
  const [ortakFaturaDetaylar, setOrtakFaturaDetaylar] = useState<IOrtakFatura>(defaultValue);

  useEffect(() => {
    if (!id) return;
    const separator = id.indexOf('_');
    const kisiId = separator >= 0 ? id.slice(0, separator) : id;
    const reportDate = separator >= 0 ? id.slice(separator + 1) : '';
    axios
      .get<IOrtakFatura>('api/reports/ortak-fatura-kisi-ay', { params: { reportDate, kisiId } })
      .then(response => setOrtakFaturaDetaylar(response.data));
  }, [id]);

  const detaylar = ortakFaturaDetaylar.ortakFaturasiDetayDto ?? [];
  const kdvToplamlar = ortakFaturaDetaylar.kdvToplamList ?? [];

  return (
    <div>
      <h2 id="OrtakFaturalar-page-heading">Ortak Fatura Detayları</h2>
      {detaylar.length > 0 ? (
        <Table responsive>
          <thead>
            <tr>
              <th>Ürün Adı</th>
              <th>Miktar</th>
              <th>Birim Fiyat</th>
              <th>Toplam Tutar</th>
            </tr>
          </thead>
          <tbody>
            {detaylar.map((detay, index) => (
              <tr key={`${detay.urunAdiKdv ?? 'detay'}-${index}`}>
                <td>{detay.urunAdiKdv}</td>
                <td>{detay.miktar}</td>
                <td>{detay.birimFiyat}</td>
                <td>{detay.toplamTutar}</td>
              </tr>
            ))}
            <tr>
              <td />
              <td />
              <td>KDV Hariç Toplam</td>
              <td>{ortakFaturaDetaylar.tumToplamKdvHaric}</td>
            </tr>
            {kdvToplamlar.map((kdv, index) => (
              <tr key={`${kdv.kdvKategorisi ?? 'kdv'}-${index}`}>
                <td />
                <td />
                <td>{kdv.kdvKategorisi}</td>
                <td>{kdv.kdvTutari}</td>
              </tr>
            ))}
            <tr>
              <td />
              <td />
              <td>KDV Toplam</td>
              <td>{ortakFaturaDetaylar.tumKdvToplami}</td>
            </tr>
            <tr>
              <td />
              <td />
              <td>Toplam</td>
              <td>{ortakFaturaDetaylar.tumToplam}</td>
            </tr>
          </tbody>
        </Table>
      ) : (
        <div className="alert alert-warning">Kayıt bulunamadı.</div>
      )}
    </div>
  );
};

export default OrtakFaturaDetail;

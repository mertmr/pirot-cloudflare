import React, { useEffect, useState } from 'react';
import Table from 'react-bootstrap/Table';
import axios from 'axios';

import { IAylikSatislarMali, defaultValue } from 'app/shared/model/aylis-satislar-mali.model';

export const AylikSatisMalilarsPage = () => {
  const [rapor, setRapor] = useState<IAylikSatislarMali>(defaultValue);

  useEffect(() => {
    axios.get<IAylikSatislarMali>('api/satis-stok-hareketleris/getMaliSatisRaporlari').then(response => setRapor(response.data));
  }, []);

  const tarihler = rapor.tarihListesi ?? [];
  const urunler = rapor.urunAdiListesi ?? [];
  const satislar = rapor.aylikSatisMap ?? {};

  return (
    <div>
      <h2 id="aylikSatisMalilars-page-heading">Aylık Satışlar</h2>
      {tarihler.length > 0 ? (
        <Table striped responsive>
          <thead>
            <tr>
              <th>Ürünler</th>
              {tarihler.map(tarih => (
                <th key={tarih}>{tarih.slice(0, 7)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {urunler.map(urun => (
              <tr key={urun}>
                <td>{urun}</td>
                {tarihler.map(tarih => {
                  const key = `${tarih.slice(0, 4)}.${tarih.slice(5, 7)}${urun}`;
                  return <td key={`${urun}-${tarih}`}>{satislar[key] ?? '-'}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <div className="alert alert-warning">Kayıt bulunamadı.</div>
      )}
    </div>
  );
};

export default AylikSatisMalilarsPage;

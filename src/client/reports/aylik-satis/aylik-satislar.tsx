import React, { useEffect, useState } from 'react';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import axios from 'axios';

import { IAylikSatislar } from 'app/shared/model/aylis-satislar.model';
import { IUrun } from 'app/shared/model/urun.model';

export const AylikSatislarsPage = () => {
  const [urunler, setUrunler] = useState<IUrun[]>([]);
  const [aylikSatislar, setAylikSatislar] = useState<IAylikSatislar[]>([]);
  const [urunId, setUrunId] = useState('');

  useEffect(() => {
    axios.get<IUrun[]>('api/uruns/stok-girisi').then(response => setUrunler(response.data));
  }, []);

  const selectUrun = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setUrunId(value);
    if (!value) {
      setAylikSatislar([]);
      return;
    }
    const response = await axios.get<IAylikSatislar[]>(`api/satis-stok-hareketleris/getSatisRaporlari/${value}`);
    setAylikSatislar(response.data);
  };

  return (
    <div>
      <h2 id="aylikSatislars-page-heading">Aylık Satışlar</h2>
      <Form.Group className="mb-3">
        <Form.Label>Satış raporunu görmek istediğiniz ürünü seçin</Form.Label>
        <Form.Select value={urunId} onChange={selectUrun}>
          <option value="">Ürün seçiniz</option>
          {urunler.map(item => (
            <option key={item.id} value={item.id}>
              {item.urunAdi}
            </option>
          ))}
        </Form.Select>
      </Form.Group>
      {aylikSatislar.length > 0 ? (
        <Table striped responsive>
          <thead>
            <tr>
              <th>Satış Tarihi</th>
              <th>Satış Miktarı</th>
            </tr>
          </thead>
          <tbody>
            {aylikSatislar.map((aylikSatis, index) => (
              <tr key={`${aylikSatis.year}-${aylikSatis.month}-${index}`}>
                <td>
                  {aylikSatis.year} - {aylikSatis.month}
                </td>
                <td>{aylikSatis.miktar}</td>
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

export default AylikSatislarsPage;

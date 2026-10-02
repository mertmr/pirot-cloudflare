import { useEffect, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Table from 'react-bootstrap/Table';
import axios from 'axios';

import { Birim } from 'app/shared/model/enumerations/birim.model';
import { IFiyat } from 'app/shared/model/fiyat.model';
import { IUrun } from 'app/shared/model/urun.model';
import { IUrunFiyatHesap } from 'app/shared/model/urun-fiyat-hesap.model';

type ConfiguredProduct = IUrun & {
  urunFiyatHesap: IUrunFiyatHesap;
};

type PriceRow = {
  product?: ConfiguredProduct;
  miktar: number;
  tutar: string;
  agirlikAta: number;
};

const createRow = (): PriceRow => ({ miktar: 0, tutar: '0', agirlikAta: 0 });

const roundToQuarter = (value: number) => Number((Math.round(value * 4) / 4).toFixed(2));

export const FiyatHesap = () => {
  const [products, setProducts] = useState<ConfiguredProduct[]>([]);
  const [rows, setRows] = useState<PriceRow[]>([createRow()]);
  const [kargo, setKargo] = useState('0');
  const [fiyatList, setFiyatList] = useState<IFiyat[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get<IUrunFiyatHesap[]>('api/urun-fiyat-hesaps', {
        params: { size: 1000, cacheBuster: Date.now() },
      });
      const configuredProducts = response.data
        .filter(item => item.urun?.id)
        .map(item => ({ ...item.urun, urunFiyatHesap: item }) as ConfiguredProduct)
        .sort((left, right) => (left.urunAdi ?? '').localeCompare(right.urunAdi ?? '', 'tr'));
      setProducts(configuredProducts);
    } catch {
      setError('Ürün fiyat bilgileri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  const updateRow = (index: number, patch: Partial<PriceRow>) => {
    setRows(current => current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  };

  const selectProduct = (index: number, productId: string) => {
    const product = products.find(item => String(item.id) === productId);
    const miktar = product?.birim === Birim.GRAM ? 100 : product ? 1 : 0;

    setRows(current => {
      const next = current.map((row, rowIndex) => (rowIndex === index ? { ...row, product, miktar, agirlikAta: miktar } : row));
      if (product && index === next.length - 1) {
        next.push(createRow());
      }
      return next;
    });
  };

  const deleteRow = (index: number) => {
    setRows(current => {
      const next = current.filter((_, rowIndex) => rowIndex !== index);
      return next.length > 0 ? next : [createRow()];
    });
  };

  const calculatePrices = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const selectedRows = rows.filter(row => row.product?.id);
    if (selectedRows.length === 0) {
      setError('Fiyat hesaplamak için en az bir ürün seçin.');
      return;
    }

    if (selectedRows.some(row => Number(row.miktar) <= 0)) {
      setError('Seçili ürünlerin miktarı sıfırdan büyük olmalı.');
      return;
    }

    const toplamKargoAgirligi = selectedRows.reduce((total, row) => total + Number(row.agirlikAta || 0), 0);
    if (Number(kargo) > 0 && toplamKargoAgirligi <= 0) {
      setError('Kargo tutarını dağıtmak için ağırlık ata toplamı sıfırdan büyük olmalı.');
      return;
    }

    const calculated = selectedRows.map(row => {
      const product = row.product!;
      const config = product.urunFiyatHesap;
      const miktar = Number(row.miktar);
      const denominator = product.birim === Birim.ADET ? miktar : miktar * 0.001;
      const shippingShare =
        Number(kargo) > 0 && toplamKargoAgirligi > 0 ? (Number(row.agirlikAta || 0) / toplamKargoAgirligi) * Number(kargo) : 0;
      const kdvDahilBirimFiyat = (Number(row.tutar || 0) + shippingShare) / denominator;
      const koopPayi =
        Number(config.amortisman || 0) +
        Number(config.dayanisma || 0) +
        Number(config.dukkanGider || 0) +
        Number(config.fire || 0) +
        Number(config.giderPusulaMustahsil || 0) +
        Number(config.kooperatifCalisma || 0);

      return {
        urunId: product.id,
        urunAdi: product.urunAdi,
        eskiFiyat: product.musteriFiyati ?? undefined,
        yeniFiyat: roundToQuarter(kdvDahilBirimFiyat * (1 + koopPayi / 100)),
        miktar,
        tutar: row.tutar || '0',
        agirlikAta: Number(row.agirlikAta || 0),
      } satisfies IFiyat;
    });

    setFiyatList(calculated);
  };

  const savePrices = async () => {
    if (fiyatList.length === 0) {
      setError('Kaydetmeden önce fiyat hesaplayın.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await axios.post('api/urun-fiyat-hesaps/yeni-fiyat', { fiyatHesapDTOList: fiyatList, kargo });
      setSuccess('Stok ve fiyat bilgileri kaydedildi.');
      setFiyatList([]);
      setRows([createRow()]);
      setKargo('0');
      await loadProducts();
    } catch {
      setError('Stok ve fiyat bilgileri kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 id="urun-fiyat-hesap-heading">Ürün Fiyat Hesapla</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Form onSubmit={calculatePrices}>
        {rows.map((row, index) => (
          <Row className="g-2 align-items-end mb-3" key={`price-row-${index}`}>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Ürün</Form.Label>
                <Form.Select value={row.product?.id ?? ''} onChange={event => selectProduct(index, event.target.value)} disabled={loading}>
                  <option value="">Ürün seçiniz</option>
                  {products.map(product => (
                    <option value={product.id} key={product.id}>
                      {product.urunAdi}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Miktar</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  step="any"
                  value={row.miktar}
                  onChange={event => updateRow(index, { miktar: Number(event.target.value) })}
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Toplam Kalem Fiyat</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  step="any"
                  value={row.tutar}
                  onChange={event => updateRow(index, { tutar: event.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Ağırlık Ata</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  step="any"
                  value={row.agirlikAta}
                  onChange={event => updateRow(index, { agirlikAta: Number(event.target.value) })}
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Button variant="outline-danger" type="button" onClick={() => deleteRow(index)} disabled={rows.length === 1}>
                Sil
              </Button>
            </Col>
          </Row>
        ))}
        <Form.Group className="mb-3" controlId="kargo_input">
          <Form.Label>Kargo</Form.Label>
          <Form.Control type="number" min="0" step="any" value={kargo} onChange={event => setKargo(event.target.value)} />
          <Form.Text>
            Kargo tutarı ağırlık ata değerlerine göre ürünlere dağıtılır. Bu alan ürünlerin gerçek ağırlığı yerine göreli dağıtım ağırlığı
            olarak da kullanılabilir.
          </Form.Text>
        </Form.Group>
        <Button variant="primary" type="submit" disabled={loading}>
          Fiyat Hesapla
        </Button>{' '}
        <Button variant="outline-secondary" type="button" onClick={() => setFiyatList([])}>
          Temizle
        </Button>
      </Form>

      <div className="table-responsive mt-4">
        {fiyatList.length > 0 ? (
          <Table responsive>
            <thead>
              <tr>
                <th>Ürün Adı</th>
                <th>Miktar</th>
                <th>Eski Fiyat</th>
                <th>Yeni Fiyat</th>
              </tr>
            </thead>
            <tbody>
              {fiyatList.map(fiyat => (
                <tr key={fiyat.urunId}>
                  <td>{fiyat.urunAdi}</td>
                  <td>{fiyat.miktar}</td>
                  <td>{fiyat.eskiFiyat}</td>
                  <td>{fiyat.yeniFiyat}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <Alert variant="warning">Fiyat hesabı bulunamadı</Alert>
        )}
      </div>

      <Button variant="primary" type="button" onClick={savePrices} disabled={saving || fiyatList.length === 0}>
        {saving ? 'Kaydediliyor…' : 'Stok ve Fiyat Gir'}
      </Button>
    </div>
  );
};

export default FiyatHesap;

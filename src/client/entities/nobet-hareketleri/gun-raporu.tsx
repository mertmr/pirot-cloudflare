import React, { useEffect, useState } from 'react';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Table from 'react-bootstrap/Table';
import axios from 'axios';

import { APP_DATE_FORMAT } from 'app/config/constants';
import { IGunSonuRaporu, defaultValueGunSonuRaporu } from 'app/shared/model/gun-sonu-raporu-model';
import CustomTextFormat from 'app/shared/util/CustomTextFormat';

const today = () => new Date().toISOString().slice(0, 10);

export const GunRaporu = () => {
  const [reportDate, setReportDate] = useState(today());
  const [gunSonuRaporu, setGunSonuRaporu] = useState<IGunSonuRaporu>(defaultValueGunSonuRaporu);

  useEffect(() => {
    axios.get<IGunSonuRaporu>('api/reports/gun-sonu-raporu', { params: { reportDate } }).then(response => setGunSonuRaporu(response.data));
  }, [reportDate]);

  return (
    <Row>
      <Col md="8">
        <h2 id="gun-sonu-page-heading">Gün Sonu Raporu</h2>
        <Form.Group className="mb-3">
          <Form.Label>Rapor Günü</Form.Label>
          <Form.Control type="date" value={reportDate} onChange={event => setReportDate(event.target.value)} />
        </Form.Group>

        <h5>Giderler</h5>
        {gunSonuRaporu.giderList?.length ? (
          <Table striped responsive>
            <thead>
              <tr>
                <th>Gider Tutar</th>
                <th>Gider Not</th>
                <th>Gider Tipi</th>
              </tr>
            </thead>
            <tbody>
              {gunSonuRaporu.giderList.map((gider, index) => (
                <tr key={gider.id ?? index}>
                  <td>{gider.tutar}</td>
                  <td>{gider.notlar}</td>
                  <td>{gider.giderTipi}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <div className="alert alert-warning">Gider Yok</div>
        )}

        <h5>Virman</h5>
        {gunSonuRaporu.virman ? (
          <Table striped responsive>
            <thead>
              <tr>
                <th>Virman Tutar</th>
                <th>Virman Not</th>
                <th>Virmanı Alan</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{gunSonuRaporu.virman.tutar}</td>
                <td>{gunSonuRaporu.virman.notlar}</td>
                <td>{gunSonuRaporu.virman.user?.login}</td>
              </tr>
            </tbody>
          </Table>
        ) : (
          <div className="alert alert-warning">Virman Yok</div>
        )}

        <h5>Ciro</h5>
        {gunSonuRaporu.dashboardReports ? (
          <Table striped responsive>
            <thead>
              <tr>
                <th>Pirot</th>
                <th>Toplam Satış</th>
                <th>Kartlı Satış</th>
                <th>Nakit Satış</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{gunSonuRaporu.dashboardReports.kasadaNeVar}</td>
                <td>{gunSonuRaporu.dashboardReports.gunlukCiro}</td>
                <td>{gunSonuRaporu.dashboardReports.kartliSatis}</td>
                <td>{gunSonuRaporu.dashboardReports.nakitSatis}</td>
              </tr>
            </tbody>
          </Table>
        ) : (
          <div className="alert alert-warning">Ciro Raporu Yok</div>
        )}

        <h5>Son Nöbet Hareketi Açılış</h5>
        {gunSonuRaporu.acilisHareketi ? (
          <Table striped responsive>
            <thead>
              <tr>
                <th>Kasa</th>
                <th>Pirot</th>
                <th>Fark Dengeleme</th>
                <th>Fark</th>
                <th>Notlar</th>
                <th>Tarih Saat</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{gunSonuRaporu.acilisHareketi.kasa}</td>
                <td>{gunSonuRaporu.acilisHareketi.pirot}</td>
                <td>{gunSonuRaporu.acilisHareketi.farkDenge}</td>
                <td>{gunSonuRaporu.acilisHareketi.fark}</td>
                <td>{gunSonuRaporu.acilisHareketi.notlar}</td>
                <td>
                  <CustomTextFormat type="date" value={gunSonuRaporu.acilisHareketi.tarih} format={APP_DATE_FORMAT} blankOnInvalid />
                </td>
              </tr>
            </tbody>
          </Table>
        ) : (
          <div className="alert alert-warning">Açılış hareketi yok.</div>
        )}

        <h5>Son Nöbet Hareketi Kapanış</h5>
        {gunSonuRaporu.nobetHareketleri ? (
          <Table striped responsive>
            <thead>
              <tr>
                <th>Kasa</th>
                <th>Pirot</th>
                <th>Fark Dengeleme</th>
                <th>Fark</th>
                <th>Notlar</th>
                <th>Tarih Saat</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{gunSonuRaporu.nobetHareketleri.kasa}</td>
                <td>{gunSonuRaporu.nobetHareketleri.pirot}</td>
                <td>{gunSonuRaporu.nobetHareketleri.farkDenge}</td>
                <td>{gunSonuRaporu.nobetHareketleri.fark}</td>
                <td>{gunSonuRaporu.nobetHareketleri.notlar}</td>
                <td>
                  <CustomTextFormat type="date" value={gunSonuRaporu.nobetHareketleri.tarih} format={APP_DATE_FORMAT} blankOnInvalid />
                </td>
              </tr>
            </tbody>
          </Table>
        ) : (
          <div className="alert alert-warning">Kapanış hareketi yok.</div>
        )}
      </Col>
    </Row>
  );
};

export default GunRaporu;

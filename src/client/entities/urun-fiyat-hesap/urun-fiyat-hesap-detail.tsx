import React, { useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { Translate } from 'react-jhipster';
import { Link, useParams } from 'app/shared/routing/navigation';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './urun-fiyat-hesap.reducer';

export const UrunFiyatHesapDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id!));
  }, []);

  const urunFiyatHesapEntity = useAppSelector(state => state.urunFiyatHesap.entity);
  return (
    <Row>
      <Col md="8">
        <h2 data-cy="urunFiyatHesapDetailsHeading">
          <Translate contentKey="koopApp.urunFiyatHesap.detail.title">UrunFiyatHesap</Translate>
        </h2>
        <dl className="jh-entity-details">
          <dt>
            <span id="id">
              <Translate contentKey="global.field.id">ID</Translate>
            </span>
          </dt>
          <dd>{urunFiyatHesapEntity.id}</dd>
          <dt>
            <span id="amortisman">
              <Translate contentKey="koopApp.urunFiyatHesap.amortisman">Amortisman</Translate>
            </span>
          </dt>
          <dd>{urunFiyatHesapEntity.amortisman}</dd>
          <dt>
            <span id="giderPusulaMustahsil">
              <Translate contentKey="koopApp.urunFiyatHesap.giderPusulaMustahsil">Gider Pusula Mustahsil</Translate>
            </span>
          </dt>
          <dd>{urunFiyatHesapEntity.giderPusulaMustahsil}</dd>
          <dt>
            <span id="dukkanGider">
              <Translate contentKey="koopApp.urunFiyatHesap.dukkanGider">Dukkan Gider</Translate>
            </span>
          </dt>
          <dd>{urunFiyatHesapEntity.dukkanGider}</dd>
          <dt>
            <span id="kooperatifCalisma">
              <Translate contentKey="koopApp.urunFiyatHesap.kooperatifCalisma">Kooperatif Calisma</Translate>
            </span>
          </dt>
          <dd>{urunFiyatHesapEntity.kooperatifCalisma}</dd>
          <dt>
            <span id="dayanisma">
              <Translate contentKey="koopApp.urunFiyatHesap.dayanisma">Dayanisma</Translate>
            </span>
          </dt>
          <dd>{urunFiyatHesapEntity.dayanisma}</dd>
          <dt>
            <span id="fire">
              <Translate contentKey="koopApp.urunFiyatHesap.fire">Fire</Translate>
            </span>
          </dt>
          <dd>{urunFiyatHesapEntity.fire}</dd>
          <dt>
            <Translate contentKey="koopApp.urunFiyatHesap.urun">Urun</Translate>
          </dt>
          <dd>{urunFiyatHesapEntity.urun ? urunFiyatHesapEntity.urun.id : ''}</dd>
        </dl>
        <Button as={Link as any} to="/urun-fiyat-hesap" replace variant="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
        &nbsp;
        <Button as={Link as any} to={`/urun-fiyat-hesap/${urunFiyatHesapEntity.id}/edit`} replace variant="primary">
          <FontAwesomeIcon icon="pencil-alt" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
        </Button>
      </Col>
    </Row>
  );
};

export default UrunFiyatHesapDetail;

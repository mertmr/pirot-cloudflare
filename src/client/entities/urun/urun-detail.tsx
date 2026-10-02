import React, { useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { Translate } from 'react-jhipster';
import { Link, useParams } from 'app/shared/routing/navigation';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './urun.reducer';

export const UrunDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id!));
  }, []);

  const urunEntity = useAppSelector(state => state.urun.entity);
  return (
    <Row>
      <Col md="8">
        <h2 data-cy="urunDetailsHeading">
          <Translate contentKey="koopApp.urun.detail.title">Urun</Translate>
        </h2>
        <dl className="jh-entity-details">
          <dt>
            <span id="id">
              <Translate contentKey="global.field.id">ID</Translate>
            </span>
          </dt>
          <dd>{urunEntity.id}</dd>
          <dt>
            <span id="urunAdi">
              <Translate contentKey="koopApp.urun.urunAdi">Urun Adi</Translate>
            </span>
          </dt>
          <dd>{urunEntity.urunAdi}</dd>
          <dt>
            <span id="stok">
              <Translate contentKey="koopApp.urun.stok">Stok</Translate>
            </span>
          </dt>
          <dd>{urunEntity.stok}</dd>
          <dt>
            <span id="stokSiniri">
              <Translate contentKey="koopApp.urun.stokSiniri">Stok Siniri</Translate>
            </span>
          </dt>
          <dd>{urunEntity.stokSiniri}</dd>
          <dt>
            <span id="musteriFiyati">
              <Translate contentKey="koopApp.urun.musteriFiyati">Musteri Fiyati</Translate>
            </span>
          </dt>
          <dd>{urunEntity.musteriFiyati}</dd>
          <dt>
            <span id="birim">
              <Translate contentKey="koopApp.urun.birim">Birim</Translate>
            </span>
          </dt>
          <dd>{urunEntity.birim}</dd>
          <dt>
            <span id="dayanismaUrunu">
              <Translate contentKey="koopApp.urun.dayanismaUrunu">Dayanisma Urunu</Translate>
            </span>
          </dt>
          <dd>{urunEntity.dayanismaUrunu ? 'true' : 'false'}</dd>
          <dt>
            <span id="satista">
              <Translate contentKey="koopApp.urun.satista">Satista</Translate>
            </span>
          </dt>
          <dd>{urunEntity.satista ? 'true' : 'false'}</dd>
          <dt>
            <span id="urunKategorisi">
              <Translate contentKey="koopApp.urun.urunKategorisi">Urun Kategorisi</Translate>
            </span>
          </dt>
          <dd>{urunEntity.urunKategorisi}</dd>
          <dt>
            <span id="active">
              <Translate contentKey="koopApp.urun.active">Active</Translate>
            </span>
          </dt>
          <dd>{urunEntity.active ? 'true' : 'false'}</dd>
          <dt>
            <Translate contentKey="koopApp.urun.urunSorumlusu">Urun Sorumlusu</Translate>
          </dt>
          <dd>{urunEntity.urunSorumlusu ? urunEntity.urunSorumlusu.login : ''}</dd>
          <dt>
            <Translate contentKey="koopApp.urun.kdvKategorisi">Kdv Kategorisi</Translate>
          </dt>
          <dd>{urunEntity.kdvKategorisi ? urunEntity.kdvKategorisi.id : ''}</dd>
        </dl>
        <Button as={Link as any} to="/urun" replace variant="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
        &nbsp;
        <Button as={Link as any} to={`/urun/${urunEntity.id}/edit`} replace variant="primary">
          <FontAwesomeIcon icon="pencil-alt" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
        </Button>
      </Col>
    </Row>
  );
};

export default UrunDetail;

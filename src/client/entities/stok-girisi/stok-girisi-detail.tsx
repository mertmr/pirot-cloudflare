import React, { useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { TextFormat, Translate } from 'react-jhipster';
import { Link, useParams } from 'app/shared/routing/navigation';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { APP_DATE_FORMAT } from 'app/config/constants';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './stok-girisi.reducer';

export const StokGirisiDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id!));
  }, []);

  const stokGirisiEntity = useAppSelector(state => state.stokGirisi.entity);
  return (
    <Row>
      <Col md="8">
        <h2 data-cy="stokGirisiDetailsHeading">
          <Translate contentKey="koopApp.stokGirisi.detail.title">StokGirisi</Translate>
        </h2>
        <dl className="jh-entity-details">
          <dt>
            <span id="id">
              <Translate contentKey="global.field.id">ID</Translate>
            </span>
          </dt>
          <dd>{stokGirisiEntity.id}</dd>
          <dt>
            <span id="miktar">
              <Translate contentKey="koopApp.stokGirisi.miktar">Miktar</Translate>
            </span>
          </dt>
          <dd>{stokGirisiEntity.miktar}</dd>
          <dt>
            <span id="agirlik">
              <Translate contentKey="koopApp.stokGirisi.agirlik">Agirlik</Translate>
            </span>
          </dt>
          <dd>{stokGirisiEntity.agirlik}</dd>
          <dt>
            <span id="notlar">
              <Translate contentKey="koopApp.stokGirisi.notlar">Notlar</Translate>
            </span>
          </dt>
          <dd>{stokGirisiEntity.notlar}</dd>
          <dt>
            <span id="stokHareketiTipi">
              <Translate contentKey="koopApp.stokGirisi.stokHareketiTipi">Stok Hareketi Tipi</Translate>
            </span>
          </dt>
          <dd>{stokGirisiEntity.stokHareketiTipi}</dd>
          <dt>
            <span id="tarih">
              <Translate contentKey="koopApp.stokGirisi.tarih">Tarih</Translate>
            </span>
          </dt>
          <dd>{stokGirisiEntity.tarih ? <TextFormat value={stokGirisiEntity.tarih} type="date" format={APP_DATE_FORMAT} /> : null}</dd>
          <dt>
            <Translate contentKey="koopApp.stokGirisi.user">User</Translate>
          </dt>
          <dd>
            {stokGirisiEntity.user ? (typeof stokGirisiEntity.user === 'string' ? stokGirisiEntity.user : stokGirisiEntity.user.login) : ''}
          </dd>
          <dt>
            <Translate contentKey="koopApp.stokGirisi.urun">Urun</Translate>
          </dt>
          <dd>{stokGirisiEntity.urun ? stokGirisiEntity.urun.urunAdi : ''}</dd>
        </dl>
        <Button as={Link as any} to="/stok-girisi" replace variant="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
        &nbsp;
        <Button as={Link as any} to={`/stok-girisi/${stokGirisiEntity.id}/edit`} replace variant="primary">
          <FontAwesomeIcon icon="pencil-alt" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
        </Button>
      </Col>
    </Row>
  );
};

export default StokGirisiDetail;

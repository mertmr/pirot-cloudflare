import React, { useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { TextFormat, Translate } from 'react-jhipster';
import { Link, useParams } from 'app/shared/routing/navigation';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { APP_DATE_FORMAT } from 'app/config/constants';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './urun-fiyat.reducer';

export const UrunFiyatDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id!));
  }, []);

  const urunFiyatEntity = useAppSelector(state => state.urunFiyat.entity);
  return (
    <Row>
      <Col md="8">
        <h2 data-cy="urunFiyatDetailsHeading">
          <Translate contentKey="koopApp.urunFiyat.detail.title">UrunFiyat</Translate>
        </h2>
        <dl className="jh-entity-details">
          <dt>
            <span id="id">
              <Translate contentKey="global.field.id">ID</Translate>
            </span>
          </dt>
          <dd>{urunFiyatEntity.id}</dd>
          <dt>
            <span id="fiyat">
              <Translate contentKey="koopApp.urunFiyat.fiyat">Fiyat</Translate>
            </span>
          </dt>
          <dd>{urunFiyatEntity.fiyat}</dd>
          <dt>
            <span id="tarih">
              <Translate contentKey="koopApp.urunFiyat.tarih">Tarih</Translate>
            </span>
          </dt>
          <dd>{urunFiyatEntity.tarih ? <TextFormat value={urunFiyatEntity.tarih} type="date" format={APP_DATE_FORMAT} /> : null}</dd>
          <dt>
            <Translate contentKey="koopApp.urunFiyat.user">User</Translate>
          </dt>
          <dd>{urunFiyatEntity.user ? urunFiyatEntity.user.login : ''}</dd>
          <dt>
            <Translate contentKey="koopApp.urunFiyat.urun">Urun</Translate>
          </dt>
          <dd>{urunFiyatEntity.urun ? urunFiyatEntity.urun.id : ''}</dd>
        </dl>
        <Button as={Link as any} to="/urun-fiyat" replace variant="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
        &nbsp;
        <Button as={Link as any} to={`/urun-fiyat/${urunFiyatEntity.id}/edit`} replace variant="primary">
          <FontAwesomeIcon icon="pencil-alt" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
        </Button>
      </Col>
    </Row>
  );
};

export default UrunFiyatDetail;

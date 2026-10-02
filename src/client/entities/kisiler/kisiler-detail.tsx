import React, { useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { TextFormat, Translate } from 'react-jhipster';
import { Link, useParams } from 'app/shared/routing/navigation';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { APP_DATE_FORMAT } from 'app/config/constants';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './kisiler.reducer';

export const KisilerDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id!));
  }, []);

  const kisilerEntity = useAppSelector(state => state.kisiler.entity);
  return (
    <Row>
      <Col md="8">
        <h2 data-cy="kisilerDetailsHeading">
          <Translate contentKey="koopApp.kisiler.detail.title">Kisiler</Translate>
        </h2>
        <dl className="jh-entity-details">
          <dt>
            <span id="id">
              <Translate contentKey="global.field.id">ID</Translate>
            </span>
          </dt>
          <dd>{kisilerEntity.id}</dd>
          <dt>
            <span id="kisiAdi">
              <Translate contentKey="koopApp.kisiler.kisiAdi">Kisi Adi</Translate>
            </span>
          </dt>
          <dd>{kisilerEntity.kisiAdi}</dd>
          <dt>
            <span id="notlar">
              <Translate contentKey="koopApp.kisiler.notlar">Notlar</Translate>
            </span>
          </dt>
          <dd>{kisilerEntity.notlar}</dd>
          <dt>
            <span id="tarih">
              <Translate contentKey="koopApp.kisiler.tarih">Tarih</Translate>
            </span>
          </dt>
          <dd>{kisilerEntity.tarih ? <TextFormat value={kisilerEntity.tarih} type="date" format={APP_DATE_FORMAT} /> : null}</dd>
          <dt>
            <span id="active">
              <Translate contentKey="koopApp.kisiler.active">Active</Translate>
            </span>
          </dt>
          <dd>{kisilerEntity.active ? 'true' : 'false'}</dd>
        </dl>
        <Button as={Link as any} to="/kisiler" replace variant="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
        &nbsp;
        <Button as={Link as any} to={`/kisiler/${kisilerEntity.id}/edit`} replace variant="primary">
          <FontAwesomeIcon icon="pencil-alt" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
        </Button>
      </Col>
    </Row>
  );
};

export default KisilerDetail;

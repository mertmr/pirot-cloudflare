import React, { useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { TextFormat, Translate } from 'react-jhipster';
import { Link, useParams } from 'app/shared/routing/navigation';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { APP_DATE_FORMAT } from 'app/config/constants';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './kasa-hareketleri.reducer';

export const KasaHareketleriDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id!));
  }, []);

  const kasaHareketleriEntity = useAppSelector(state => state.kasaHareketleri.entity);
  return (
    <Row>
      <Col md="8">
        <h2 data-cy="kasaHareketleriDetailsHeading">
          <Translate contentKey="koopApp.kasaHareketleri.detail.title">KasaHareketleri</Translate>
        </h2>
        <dl className="jh-entity-details">
          <dt>
            <span id="id">
              <Translate contentKey="global.field.id">ID</Translate>
            </span>
          </dt>
          <dd>{kasaHareketleriEntity.id}</dd>
          <dt>
            <span id="kasaMiktar">
              <Translate contentKey="koopApp.kasaHareketleri.kasaMiktar">Kasa Miktar</Translate>
            </span>
          </dt>
          <dd>{kasaHareketleriEntity.kasaMiktar}</dd>
          <dt>
            <span id="hareket">
              <Translate contentKey="koopApp.kasaHareketleri.hareket">Hareket</Translate>
            </span>
          </dt>
          <dd>{kasaHareketleriEntity.hareket}</dd>
          <dt>
            <span id="tarih">
              <Translate contentKey="koopApp.kasaHareketleri.tarih">Tarih</Translate>
            </span>
          </dt>
          <dd>
            {kasaHareketleriEntity.tarih ? <TextFormat value={kasaHareketleriEntity.tarih} type="date" format={APP_DATE_FORMAT} /> : null}
          </dd>
        </dl>
        <Button as={Link as any} to="/kasa-hareketleri" replace variant="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
        &nbsp;
        <Button as={Link as any} to={`/kasa-hareketleri/${kasaHareketleriEntity.id}/edit`} replace variant="primary">
          <FontAwesomeIcon icon="pencil-alt" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
        </Button>
      </Col>
    </Row>
  );
};

export default KasaHareketleriDetail;

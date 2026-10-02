import { CorrectionRecord } from 'app/shared/financial/nobet-correction';
import React, { useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { TextFormat, Translate } from 'react-jhipster';
import { Link, useParams } from 'app/shared/routing/navigation';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { APP_DATE_FORMAT } from 'app/config/constants';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './gider.reducer';

export const GiderDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id!));
  }, []);

  const giderEntity = useAppSelector(state => state.gider.entity);
  return (
    <Row>
      <Col md="8">
        <h2 data-cy="giderDetailsHeading">
          <Translate contentKey="koopApp.gider.detail.title">Gider</Translate>
        </h2>
        {id && <CorrectionRecord type="gider" id={id} />}
        <dl className="jh-entity-details">
          <dt>
            <span id="id">
              <Translate contentKey="global.field.id">ID</Translate>
            </span>
          </dt>
          <dd>{giderEntity.id}</dd>
          <dt>
            <span id="tarih">
              <Translate contentKey="koopApp.gider.tarih">Tarih</Translate>
            </span>
          </dt>
          <dd>{giderEntity.tarih ? <TextFormat value={giderEntity.tarih} type="date" format={APP_DATE_FORMAT} /> : null}</dd>
          <dt>
            <span id="tutar">
              <Translate contentKey="koopApp.gider.tutar">Tutar</Translate>
            </span>
          </dt>
          <dd>{giderEntity.tutar}</dd>
          <dt>
            <span id="notlar">
              <Translate contentKey="koopApp.gider.notlar">Notlar</Translate>
            </span>
          </dt>
          <dd>{giderEntity.notlar}</dd>
          <dt>
            <span id="giderTipi">
              <Translate contentKey="koopApp.gider.giderTipi">Gider Tipi</Translate>
            </span>
          </dt>
          <dd>{giderEntity.giderTipi}</dd>
          <dt>
            <span id="odemeAraci">
              <Translate contentKey="koopApp.gider.odemeAraci">Odeme Araci</Translate>
            </span>
          </dt>
          <dd>{giderEntity.odemeAraci}</dd>
          <dt>
            <Translate contentKey="koopApp.gider.user">User</Translate>
          </dt>
          <dd>{giderEntity.user ? giderEntity.user.login : ''}</dd>
        </dl>
        <Button as={Link as any} to="/gider" replace variant="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
        &nbsp;
        <Button as={Link as any} to={`/gider/${giderEntity.id}/edit`} replace variant="primary">
          <FontAwesomeIcon icon="pencil-alt" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
        </Button>
      </Col>
    </Row>
  );
};

export default GiderDetail;

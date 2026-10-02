import React, { useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { TextFormat, Translate } from 'react-jhipster';
import { Link, useParams } from 'app/shared/routing/navigation';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { APP_DATE_FORMAT } from 'app/config/constants';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './uretici.reducer';

export const UreticiDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id!));
  }, []);

  const ureticiEntity = useAppSelector(state => state.uretici.entity);
  return (
    <Row>
      <Col md="8">
        <h2 data-cy="ureticiDetailsHeading">
          <Translate contentKey="koopApp.uretici.detail.title">Uretici</Translate>
        </h2>
        <dl className="jh-entity-details">
          <dt>
            <span id="id">
              <Translate contentKey="global.field.id">ID</Translate>
            </span>
          </dt>
          <dd>{ureticiEntity.id}</dd>
          <dt>
            <span id="adi">
              <Translate contentKey="koopApp.uretici.adi">Adi</Translate>
            </span>
          </dt>
          <dd>{ureticiEntity.adi}</dd>
          <dt>
            <span id="adres">
              <Translate contentKey="koopApp.uretici.adres">Adres</Translate>
            </span>
          </dt>
          <dd>{ureticiEntity.adres}</dd>
          <dt>
            <span id="bankaBilgileri">
              <Translate contentKey="koopApp.uretici.bankaBilgileri">Banka Bilgileri</Translate>
            </span>
          </dt>
          <dd>{ureticiEntity.bankaBilgileri}</dd>
          <dt>
            <span id="tarih">
              <Translate contentKey="koopApp.uretici.tarih">Tarih</Translate>
            </span>
          </dt>
          <dd>{ureticiEntity.tarih ? <TextFormat value={ureticiEntity.tarih} type="date" format={APP_DATE_FORMAT} /> : null}</dd>
          <dt>
            <Translate contentKey="koopApp.uretici.user">User</Translate>
          </dt>
          <dd>{ureticiEntity.user ? ureticiEntity.user.login : ''}</dd>
        </dl>
        <Button as={Link as any} to="/uretici" replace variant="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
        &nbsp;
        <Button as={Link as any} to={`/uretici/${ureticiEntity.id}/edit`} replace variant="primary">
          <FontAwesomeIcon icon="pencil-alt" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
        </Button>
      </Col>
    </Row>
  );
};

export default UreticiDetail;

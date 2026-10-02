import React, { useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { TextFormat, Translate } from 'react-jhipster';
import { Link, useParams } from 'app/shared/routing/navigation';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { APP_DATE_FORMAT } from 'app/config/constants';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './uretici-odemeleri.reducer';

export const UreticiOdemeleriDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id!));
  }, []);

  const ureticiOdemeleriEntity = useAppSelector(state => state.ureticiOdemeleri.entity);
  return (
    <Row>
      <Col md="8">
        <h2 data-cy="ureticiOdemeleriDetailsHeading">
          <Translate contentKey="koopApp.ureticiOdemeleri.detail.title">UreticiOdemeleri</Translate>
        </h2>
        <dl className="jh-entity-details">
          <dt>
            <span id="id">
              <Translate contentKey="global.field.id">ID</Translate>
            </span>
          </dt>
          <dd>{ureticiOdemeleriEntity.id}</dd>
          <dt>
            <span id="tutar">
              <Translate contentKey="koopApp.ureticiOdemeleri.tutar">Tutar</Translate>
            </span>
          </dt>
          <dd>{ureticiOdemeleriEntity.tutar}</dd>
          <dt>
            <span id="sonGuncellenmeTarihi">
              <Translate contentKey="koopApp.ureticiOdemeleri.sonGuncellenmeTarihi">Son Guncellenme Tarihi</Translate>
            </span>
          </dt>
          <dd>
            {ureticiOdemeleriEntity.sonGuncellenmeTarihi ? (
              <TextFormat value={ureticiOdemeleriEntity.sonGuncellenmeTarihi} type="date" format={APP_DATE_FORMAT} />
            ) : null}
          </dd>
          <dt>
            <Translate contentKey="koopApp.ureticiOdemeleri.uretici">Uretici</Translate>
          </dt>
          <dd>{ureticiOdemeleriEntity.uretici ? ureticiOdemeleriEntity.uretici.id : ''}</dd>
        </dl>
        <Button as={Link as any} to="/uretici-odemeleri" replace variant="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
        &nbsp;
        <Button as={Link as any} to={`/uretici-odemeleri/${ureticiOdemeleriEntity.id}/edit`} replace variant="primary">
          <FontAwesomeIcon icon="pencil-alt" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
        </Button>
      </Col>
    </Row>
  );
};

export default UreticiOdemeleriDetail;

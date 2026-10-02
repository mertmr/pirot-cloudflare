import React, { useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { Translate } from 'react-jhipster';
import { Link, useParams } from 'app/shared/routing/navigation';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './kdv-kategorisi.reducer';

export const KdvKategorisiDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id!));
  }, []);

  const kdvKategorisiEntity = useAppSelector(state => state.kdvKategorisi.entity);
  return (
    <Row>
      <Col md="8">
        <h2 data-cy="kdvKategorisiDetailsHeading">
          <Translate contentKey="koopApp.kdvKategorisi.detail.title">KdvKategorisi</Translate>
        </h2>
        <dl className="jh-entity-details">
          <dt>
            <span id="id">
              <Translate contentKey="global.field.id">ID</Translate>
            </span>
          </dt>
          <dd>{kdvKategorisiEntity.id}</dd>
          <dt>
            <span id="kategoriAdi">
              <Translate contentKey="koopApp.kdvKategorisi.kategoriAdi">Kategori Adi</Translate>
            </span>
          </dt>
          <dd>{kdvKategorisiEntity.kategoriAdi}</dd>
          <dt>
            <span id="kdvOrani">
              <Translate contentKey="koopApp.kdvKategorisi.kdvOrani">Kdv Orani</Translate>
            </span>
          </dt>
          <dd>{kdvKategorisiEntity.kdvOrani}</dd>
        </dl>
        <Button as={Link as any} to="/kdv-kategorisi" replace variant="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
        &nbsp;
        <Button as={Link as any} to={`/kdv-kategorisi/${kdvKategorisiEntity.id}/edit`} replace variant="primary">
          <FontAwesomeIcon icon="pencil-alt" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
        </Button>
      </Col>
    </Row>
  );
};

export default KdvKategorisiDetail;

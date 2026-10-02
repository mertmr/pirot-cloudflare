import React, { useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { Translate } from 'react-jhipster';
import { Link, useParams } from 'app/shared/routing/navigation';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './satis-stok-hareketleri.reducer';

export const SatisStokHareketleriDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id!));
  }, []);

  const satisStokHareketleriEntity = useAppSelector(state => state.satisStokHareketleri.entity);
  return (
    <Row>
      <Col md="8">
        <h2 data-cy="satisStokHareketleriDetailsHeading">
          <Translate contentKey="koopApp.satisStokHareketleri.detail.title">SatisStokHareketleri</Translate>
        </h2>
        <dl className="jh-entity-details">
          <dt>
            <span id="id">
              <Translate contentKey="global.field.id">ID</Translate>
            </span>
          </dt>
          <dd>{satisStokHareketleriEntity.id}</dd>
          <dt>
            <span id="miktar">
              <Translate contentKey="koopApp.satisStokHareketleri.miktar">Miktar</Translate>
            </span>
          </dt>
          <dd>{satisStokHareketleriEntity.miktar}</dd>
          <dt>
            <span id="tutar">
              <Translate contentKey="koopApp.satisStokHareketleri.tutar">Tutar</Translate>
            </span>
          </dt>
          <dd>{satisStokHareketleriEntity.tutar}</dd>
          <dt>
            <Translate contentKey="koopApp.satisStokHareketleri.urun">Urun</Translate>
          </dt>
          <dd>{satisStokHareketleriEntity.urun ? satisStokHareketleriEntity.urun.id : ''}</dd>
          <dt>
            <Translate contentKey="koopApp.satisStokHareketleri.satis">Satis</Translate>
          </dt>
          <dd>{satisStokHareketleriEntity.satis ? satisStokHareketleriEntity.satis.id : ''}</dd>
        </dl>
        <Button as={Link as any} to="/satis-stok-hareketleri" replace variant="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
        &nbsp;
        <Button as={Link as any} to={`/satis-stok-hareketleri/${satisStokHareketleriEntity.id}/edit`} replace variant="primary">
          <FontAwesomeIcon icon="pencil-alt" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
        </Button>
      </Col>
    </Row>
  );
};

export default SatisStokHareketleriDetail;

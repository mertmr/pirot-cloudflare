import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { TextFormat, Translate } from 'react-jhipster';
import { Link, useParams } from 'app/shared/routing/navigation';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { APP_DATE_FORMAT } from 'app/config/constants';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { collectPayment, getEntity } from './borc-alacak.reducer';
import { isCollectableBorc } from './borc-alacak.util';
import { CollectPaymentDialog } from './collect-payment-dialog';

export const BorcAlacakDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();
  const [collectDialogOpen, setCollectDialogOpen] = useState(false);

  useEffect(() => {
    dispatch(getEntity(id!));
  }, []);

  const borcAlacakEntity = useAppSelector(state => state.borcAlacak.entity);
  const updating = useAppSelector(state => state.borcAlacak.updating);
  const updateSuccess = useAppSelector(state => state.borcAlacak.updateSuccess);

  useEffect(() => {
    if (updateSuccess) {
      setCollectDialogOpen(false);
    }
  }, [updateSuccess]);
  return (
    <Row>
      <Col md="8">
        <h2 data-cy="borcAlacakDetailsHeading">
          <Translate contentKey="koopApp.borcAlacak.detail.title">BorcAlacak</Translate>
        </h2>
        <dl className="jh-entity-details">
          <dt>
            <span id="id">
              <Translate contentKey="global.field.id">ID</Translate>
            </span>
          </dt>
          <dd>{borcAlacakEntity.id}</dd>
          <dt>
            <span id="tutar">
              <Translate contentKey="koopApp.borcAlacak.tutar">Tutar</Translate>
            </span>
          </dt>
          <dd>{borcAlacakEntity.tutar}</dd>
          <dt>
            <span id="notlar">
              <Translate contentKey="koopApp.borcAlacak.notlar">Notlar</Translate>
            </span>
          </dt>
          <dd>{borcAlacakEntity.notlar}</dd>
          <dt>
            <span id="odemeAraci">
              <Translate contentKey="koopApp.borcAlacak.odemeAraci">Odeme Araci</Translate>
            </span>
          </dt>
          <dd>{borcAlacakEntity.odemeAraci}</dd>
          <dt>
            <span id="hareketTipi">
              <Translate contentKey="koopApp.borcAlacak.hareketTipi">Hareket Tipi</Translate>
            </span>
          </dt>
          <dd>{borcAlacakEntity.hareketTipi}</dd>
          <dt>
            <span id="tarih">
              <Translate contentKey="koopApp.borcAlacak.tarih">Tarih</Translate>
            </span>
          </dt>
          <dd>{borcAlacakEntity.tarih ? <TextFormat value={borcAlacakEntity.tarih} type="date" format={APP_DATE_FORMAT} /> : null}</dd>
          <dt>
            <Translate contentKey="koopApp.borcAlacak.user">User</Translate>
          </dt>
          <dd>{borcAlacakEntity.user ? borcAlacakEntity.user.login : ''}</dd>
          <dt>
            <Translate contentKey="koopApp.borcAlacak.urun">Urun</Translate>
          </dt>
          <dd>{borcAlacakEntity.urun ? borcAlacakEntity.urun.urunAdi : ''}</dd>
        </dl>
        <Button as={Link as any} to="/borc-alacak" replace variant="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
        &nbsp;
        <Button as={Link as any} to={`/borc-alacak/${borcAlacakEntity.id}/edit`} replace variant="primary">
          <FontAwesomeIcon icon="pencil-alt" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
        </Button>
        {isCollectableBorc(borcAlacakEntity) && (
          <>
            &nbsp;
            <Button variant="success" data-cy="collectPaymentButton" onClick={() => setCollectDialogOpen(true)}>
              <FontAwesomeIcon icon="hand-holding-usd" />{' '}
              <span className="d-none d-md-inline">
                <Translate contentKey="entity.action.collectPayment">Collect Payment</Translate>
              </span>
            </Button>
          </>
        )}
        <CollectPaymentDialog
          show={collectDialogOpen}
          saving={updating}
          onCancel={() => setCollectDialogOpen(false)}
          onConfirm={paymentMethod => {
            if (borcAlacakEntity.id !== undefined) {
              dispatch(collectPayment({ id: borcAlacakEntity.id, paymentMethod }));
            }
          }}
        />
      </Col>
    </Row>
  );
};

export default BorcAlacakDetail;

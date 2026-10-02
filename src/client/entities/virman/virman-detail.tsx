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

import { getEntity } from './virman.reducer';

export const VirmanDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id!));
  }, []);

  const virmanEntity = useAppSelector(state => state.virman.entity);
  return (
    <Row>
      <Col md="8">
        <h2 data-cy="virmanDetailsHeading">
          <Translate contentKey="koopApp.virman.detail.title">Virman</Translate>
        </h2>
        {id && <CorrectionRecord type="virman" id={id} />}
        <dl className="jh-entity-details">
          <dt>
            <span id="id">
              <Translate contentKey="global.field.id">ID</Translate>
            </span>
          </dt>
          <dd>{virmanEntity.id}</dd>
          <dt>
            <span id="tutar">
              <Translate contentKey="koopApp.virman.tutar">Tutar</Translate>
            </span>
          </dt>
          <dd>{virmanEntity.tutar}</dd>
          <dt>
            <span id="notlar">
              <Translate contentKey="koopApp.virman.notlar">Notlar</Translate>
            </span>
          </dt>
          <dd>{virmanEntity.notlar}</dd>
          <dt>
            <span id="cikisHesabi">
              <Translate contentKey="koopApp.virman.cikisHesabi">Cikis Hesabi</Translate>
            </span>
          </dt>
          <dd>{virmanEntity.cikisHesabi}</dd>
          <dt>
            <span id="girisHesabi">
              <Translate contentKey="koopApp.virman.girisHesabi">Giris Hesabi</Translate>
            </span>
          </dt>
          <dd>{virmanEntity.girisHesabi}</dd>
          <dt>
            <span id="tarih">
              <Translate contentKey="koopApp.virman.tarih">Tarih</Translate>
            </span>
          </dt>
          <dd>{virmanEntity.tarih ? <TextFormat value={virmanEntity.tarih} type="date" format={APP_DATE_FORMAT} /> : null}</dd>
          <dt>
            <Translate contentKey="koopApp.virman.user">User</Translate>
          </dt>
          <dd>{virmanEntity.user ? virmanEntity.user.login : ''}</dd>
        </dl>
        <Button as={Link as any} to="/virman" replace variant="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
        &nbsp;
        <Button as={Link as any} to={`/virman/${virmanEntity.id}/edit`} replace variant="primary">
          <FontAwesomeIcon icon="pencil-alt" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
        </Button>
      </Col>
    </Row>
  );
};

export default VirmanDetail;

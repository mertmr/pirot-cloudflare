import React, { useEffect, useState } from 'react';
import { CorrectionFields } from 'app/shared/financial/nobet-correction';
import { IDuzeltmeTalebi } from 'app/shared/model/nobet-duzeltme.model';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import ModalBody from 'react-bootstrap/ModalBody';
import ModalFooter from 'react-bootstrap/ModalFooter';
import ModalHeader from 'react-bootstrap/ModalHeader';
import { Translate } from 'react-jhipster';
import { useLocation, useNavigate, useParams } from 'app/shared/routing/navigation';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { deleteEntity, getEntity } from './satis.reducer';

export const SatisDeleteDialog = () => {
  const dispatch = useAppDispatch();
  const pageLocation = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();

  const [closed, setClosed] = useState(false);
  const [duzeltme, setDuzeltme] = useState<IDuzeltmeTalebi>();
  const [blocked, setBlocked] = useState(true);
  const [loadModal, setLoadModal] = useState(false);

  useEffect(() => {
    dispatch(getEntity(id!));
    setLoadModal(true);
  }, []);

  const satisEntity = useAppSelector(state => state.satis.entity);
  const updateSuccess = useAppSelector(state => state.satis.updateSuccess);

  const handleClose = () => {
    navigate(`/satis${pageLocation.search}`);
  };

  useEffect(() => {
    if (updateSuccess && loadModal) {
      handleClose();
      setLoadModal(false);
    }
  }, [updateSuccess]);

  const confirmDelete = () => {
    if (!blocked && satisEntity.id) dispatch(deleteEntity({ id: satisEntity.id, duzeltme }));
  };

  return (
    <Modal show onHide={handleClose}>
      <ModalHeader data-cy="satisDeleteDialogHeading" closeButton>
        <Translate contentKey={closed ? 'correction.cancelTitle' : 'entity.delete.title'}>Confirm delete operation</Translate>
      </ModalHeader>
      <ModalBody id="koopApp.satis.delete.question">
        <Translate contentKey={closed ? 'correction.cancelQuestion' : 'koopApp.satis.delete.question'} interpolate={{ id: satisEntity.id }}>
          Are you sure you want to delete this Satis?
        </Translate>
      </ModalBody>
      <ModalBody>
        <CorrectionFields type="satis" id={id} onChange={setDuzeltme} onBlocked={setBlocked} onClosed={setClosed} />
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={handleClose}>
          <FontAwesomeIcon icon="ban" />
          &nbsp;
          <Translate contentKey="entity.action.cancel">Cancel</Translate>
        </Button>
        <Button
          id="koop-confirm-delete-satis"
          data-cy="entityConfirmDeleteButton"
          variant="danger"
          disabled={blocked || satisEntity.id !== Number(id)}
          onClick={confirmDelete}
        >
          <FontAwesomeIcon icon="trash" />
          &nbsp;
          <Translate contentKey={closed ? 'correction.cancelAction' : 'entity.action.delete'}>Delete</Translate>
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default SatisDeleteDialog;

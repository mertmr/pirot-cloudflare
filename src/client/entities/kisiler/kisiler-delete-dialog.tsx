import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import ModalBody from 'react-bootstrap/ModalBody';
import ModalFooter from 'react-bootstrap/ModalFooter';
import ModalHeader from 'react-bootstrap/ModalHeader';
import { Translate } from 'react-jhipster';
import { useLocation, useNavigate, useParams } from 'app/shared/routing/navigation';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { deleteEntity, getEntity } from './kisiler.reducer';

export const KisilerDeleteDialog = () => {
  const dispatch = useAppDispatch();
  const pageLocation = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();

  const [loadModal, setLoadModal] = useState(false);

  useEffect(() => {
    dispatch(getEntity(id!));
    setLoadModal(true);
  }, []);

  const kisilerEntity = useAppSelector(state => state.kisiler.entity);
  const updateSuccess = useAppSelector(state => state.kisiler.updateSuccess);

  const handleClose = () => {
    navigate(`/kisiler${pageLocation.search}`);
  };

  useEffect(() => {
    if (updateSuccess && loadModal) {
      handleClose();
      setLoadModal(false);
    }
  }, [updateSuccess]);

  const confirmDelete = () => {
    if (kisilerEntity.id === undefined) return;
    dispatch(deleteEntity(kisilerEntity.id));
  };

  return (
    <Modal show onHide={handleClose}>
      <ModalHeader data-cy="kisilerDeleteDialogHeading" closeButton>
        <Translate contentKey="entity.delete.title">Confirm delete operation</Translate>
      </ModalHeader>
      <ModalBody id="koopApp.kisiler.delete.question">
        <Translate contentKey="koopApp.kisiler.delete.question" interpolate={{ id: kisilerEntity.id }}>
          Are you sure you want to delete this Kisiler?
        </Translate>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={handleClose}>
          <FontAwesomeIcon icon="ban" />
          &nbsp;
          <Translate contentKey="entity.action.cancel">Cancel</Translate>
        </Button>
        <Button id="koop-confirm-delete-kisiler" data-cy="entityConfirmDeleteButton" variant="danger" onClick={confirmDelete}>
          <FontAwesomeIcon icon="trash" />
          &nbsp;
          <Translate contentKey="entity.action.delete">Delete</Translate>
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default KisilerDeleteDialog;

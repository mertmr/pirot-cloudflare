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

import { deleteEntity, getEntity } from './satis-stok-hareketleri.reducer';

export const SatisStokHareketleriDeleteDialog = () => {
  const dispatch = useAppDispatch();
  const pageLocation = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();

  const [loadModal, setLoadModal] = useState(false);

  useEffect(() => {
    dispatch(getEntity(id!));
    setLoadModal(true);
  }, []);

  const satisStokHareketleriEntity = useAppSelector(state => state.satisStokHareketleri.entity);
  const updateSuccess = useAppSelector(state => state.satisStokHareketleri.updateSuccess);

  const handleClose = () => {
    navigate(`/satis-stok-hareketleri${pageLocation.search}`);
  };

  useEffect(() => {
    if (updateSuccess && loadModal) {
      handleClose();
      setLoadModal(false);
    }
  }, [updateSuccess]);

  const confirmDelete = () => {
    if (satisStokHareketleriEntity.id === undefined) return;
    dispatch(deleteEntity(satisStokHareketleriEntity.id));
  };

  return (
    <Modal show onHide={handleClose}>
      <ModalHeader data-cy="satisStokHareketleriDeleteDialogHeading" closeButton>
        <Translate contentKey="entity.delete.title">Confirm delete operation</Translate>
      </ModalHeader>
      <ModalBody id="koopApp.satisStokHareketleri.delete.question">
        <Translate contentKey="koopApp.satisStokHareketleri.delete.question" interpolate={{ id: satisStokHareketleriEntity.id }}>
          Are you sure you want to delete this SatisStokHareketleri?
        </Translate>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={handleClose}>
          <FontAwesomeIcon icon="ban" />
          &nbsp;
          <Translate contentKey="entity.action.cancel">Cancel</Translate>
        </Button>
        <Button id="koop-confirm-delete-satisStokHareketleri" data-cy="entityConfirmDeleteButton" variant="danger" onClick={confirmDelete}>
          <FontAwesomeIcon icon="trash" />
          &nbsp;
          <Translate contentKey="entity.action.delete">Delete</Translate>
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default SatisStokHareketleriDeleteDialog;

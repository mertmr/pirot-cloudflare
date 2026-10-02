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

import { deleteEntity, getEntity } from './urun-fiyat-hesap.reducer';

export const UrunFiyatHesapDeleteDialog = () => {
  const dispatch = useAppDispatch();
  const pageLocation = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();

  const [loadModal, setLoadModal] = useState(false);

  useEffect(() => {
    dispatch(getEntity(id!));
    setLoadModal(true);
  }, []);

  const urunFiyatHesapEntity = useAppSelector(state => state.urunFiyatHesap.entity);
  const updateSuccess = useAppSelector(state => state.urunFiyatHesap.updateSuccess);

  const handleClose = () => {
    navigate(`/urun-fiyat-hesap${pageLocation.search}`);
  };

  useEffect(() => {
    if (updateSuccess && loadModal) {
      handleClose();
      setLoadModal(false);
    }
  }, [updateSuccess]);

  const confirmDelete = () => {
    if (urunFiyatHesapEntity.id === undefined) return;
    dispatch(deleteEntity(urunFiyatHesapEntity.id));
  };

  return (
    <Modal show onHide={handleClose}>
      <ModalHeader data-cy="urunFiyatHesapDeleteDialogHeading" closeButton>
        <Translate contentKey="entity.delete.title">Confirm delete operation</Translate>
      </ModalHeader>
      <ModalBody id="koopApp.urunFiyatHesap.delete.question">
        <Translate contentKey="koopApp.urunFiyatHesap.delete.question" interpolate={{ id: urunFiyatHesapEntity.id }}>
          Are you sure you want to delete this UrunFiyatHesap?
        </Translate>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={handleClose}>
          <FontAwesomeIcon icon="ban" />
          &nbsp;
          <Translate contentKey="entity.action.cancel">Cancel</Translate>
        </Button>
        <Button id="koop-confirm-delete-urunFiyatHesap" data-cy="entityConfirmDeleteButton" variant="danger" onClick={confirmDelete}>
          <FontAwesomeIcon icon="trash" />
          &nbsp;
          <Translate contentKey="entity.action.delete">Delete</Translate>
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default UrunFiyatHesapDeleteDialog;

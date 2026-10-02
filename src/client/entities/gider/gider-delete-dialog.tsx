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

import { deleteEntity, getEntity } from './gider.reducer';

export const GiderDeleteDialog = () => {
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

  const giderEntity = useAppSelector(state => state.gider.entity);
  const updateSuccess = useAppSelector(state => state.gider.updateSuccess);

  const handleClose = () => {
    navigate(`/gider${pageLocation.search}`);
  };

  useEffect(() => {
    if (updateSuccess && loadModal) {
      handleClose();
      setLoadModal(false);
    }
  }, [updateSuccess]);

  const confirmDelete = () => {
    if (!blocked && giderEntity.id) dispatch(deleteEntity({ id: giderEntity.id, duzeltme }));
  };

  return (
    <Modal show onHide={handleClose}>
      <ModalHeader data-cy="giderDeleteDialogHeading" closeButton>
        <Translate contentKey={closed ? 'correction.cancelTitle' : 'entity.delete.title'}>Confirm delete operation</Translate>
      </ModalHeader>
      <ModalBody id="koopApp.gider.delete.question">
        <Translate contentKey={closed ? 'correction.cancelQuestion' : 'koopApp.gider.delete.question'} interpolate={{ id: giderEntity.id }}>
          Are you sure you want to delete this Gider?
        </Translate>
      </ModalBody>
      <ModalBody>
        <CorrectionFields type="gider" id={id} onChange={setDuzeltme} onBlocked={setBlocked} onClosed={setClosed} />
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={handleClose}>
          <FontAwesomeIcon icon="ban" />
          &nbsp;
          <Translate contentKey="entity.action.cancel">Cancel</Translate>
        </Button>
        <Button
          id="koop-confirm-delete-gider"
          data-cy="entityConfirmDeleteButton"
          variant="danger"
          disabled={blocked || giderEntity.id !== Number(id)}
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

export default GiderDeleteDialog;

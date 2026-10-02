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

import { deleteEntity, getEntity } from './virman.reducer';

export const VirmanDeleteDialog = () => {
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

  const virmanEntity = useAppSelector(state => state.virman.entity);
  const updateSuccess = useAppSelector(state => state.virman.updateSuccess);

  const handleClose = () => {
    navigate(`/virman${pageLocation.search}`);
  };

  useEffect(() => {
    if (updateSuccess && loadModal) {
      handleClose();
      setLoadModal(false);
    }
  }, [updateSuccess]);

  const confirmDelete = () => {
    if (!blocked && virmanEntity.id) dispatch(deleteEntity({ id: virmanEntity.id, duzeltme }));
  };

  return (
    <Modal show onHide={handleClose}>
      <ModalHeader data-cy="virmanDeleteDialogHeading" closeButton>
        <Translate contentKey={closed ? 'correction.cancelTitle' : 'entity.delete.title'}>Confirm delete operation</Translate>
      </ModalHeader>
      <ModalBody id="koopApp.virman.delete.question">
        <Translate
          contentKey={closed ? 'correction.cancelQuestion' : 'koopApp.virman.delete.question'}
          interpolate={{ id: virmanEntity.id }}
        >
          Are you sure you want to delete this Virman?
        </Translate>
      </ModalBody>
      <ModalBody>
        <CorrectionFields type="virman" id={id} onChange={setDuzeltme} onBlocked={setBlocked} onClosed={setClosed} />
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={handleClose}>
          <FontAwesomeIcon icon="ban" />
          &nbsp;
          <Translate contentKey="entity.action.cancel">Cancel</Translate>
        </Button>
        <Button
          id="koop-confirm-delete-virman"
          data-cy="entityConfirmDeleteButton"
          variant="danger"
          disabled={blocked || virmanEntity.id !== Number(id)}
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

export default VirmanDeleteDialog;

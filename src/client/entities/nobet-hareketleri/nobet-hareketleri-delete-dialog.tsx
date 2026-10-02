import React from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import ModalBody from 'react-bootstrap/ModalBody';
import ModalFooter from 'react-bootstrap/ModalFooter';
import ModalHeader from 'react-bootstrap/ModalHeader';
import { Translate } from 'react-jhipster';
import { useLocation, useNavigate } from 'app/shared/routing/navigation';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export const NobetHareketleriDeleteDialog = () => {
  const pageLocation = useLocation();
  const navigate = useNavigate();

  const handleClose = () => {
    navigate(`/nobet-hareketleri${pageLocation.search}`);
  };

  return (
    <Modal show onHide={handleClose}>
      <ModalHeader data-cy="nobetHareketleriDeleteDialogHeading" closeButton>
        <Translate contentKey="entity.delete.title">Confirm delete operation</Translate>
      </ModalHeader>
      <ModalBody id="koopApp.nobetHareketleri.delete.question">
        <Translate contentKey="koopApp.nobetHareketleri.deletionNotAllowed">
          Nöbet hareketleri rapor geçmişini korumak için silinemez.
        </Translate>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={handleClose}>
          <FontAwesomeIcon icon="ban" />
          &nbsp;
          <Translate contentKey="entity.action.cancel">Cancel</Translate>
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default NobetHareketleriDeleteDialog;

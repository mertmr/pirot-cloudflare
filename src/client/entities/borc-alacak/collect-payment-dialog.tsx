import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import ModalBody from 'react-bootstrap/ModalBody';
import ModalFooter from 'react-bootstrap/ModalFooter';
import ModalHeader from 'react-bootstrap/ModalHeader';
import { Translate } from 'react-jhipster';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export type PaymentMethod = 'NAKIT' | 'BANKA';

export interface ICollectPaymentDialogProps {
  show: boolean;
  saving?: boolean;
  onConfirm: (paymentMethod: PaymentMethod) => void;
  onCancel: () => void;
}

/**
 * Asks which payment method a deferred debt was collected with. The server
 * owns the cash and paid-state effects; this dialog only expresses intent.
 */
export const CollectPaymentDialog = ({ show, saving, onConfirm, onCancel }: ICollectPaymentDialogProps) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');

  useEffect(() => {
    if (!show) {
      setPaymentMethod('');
    }
  }, [show]);

  return (
    <Modal show={show} onHide={onCancel} backdrop="static" data-cy="collectPaymentDialog">
      <ModalHeader closeButton>
        <Translate contentKey="entity.action.selectPaymentMethod">Select Payment Method</Translate>
      </ModalHeader>
      <ModalBody>
        <p>
          <Translate contentKey="entity.action.selectPaymentMethodMessage">
            Please select the payment method you will use to collect this debt payment:
          </Translate>
        </p>
        <Form.Group controlId="collect-payment-method">
          <Form.Check
            type="radio"
            name="collect-payment-method"
            id="collect-payment-nakit"
            checked={paymentMethod === 'NAKIT'}
            onChange={() => setPaymentMethod('NAKIT')}
            label={<Translate contentKey="koopApp.OdemeAraci.NAKIT">Nakit</Translate>}
            data-cy="collectPaymentNakit"
          />
          <Form.Check
            type="radio"
            name="collect-payment-method"
            id="collect-payment-banka"
            checked={paymentMethod === 'BANKA'}
            onChange={() => setPaymentMethod('BANKA')}
            label={<Translate contentKey="koopApp.OdemeAraci.BANKA">Kart</Translate>}
            data-cy="collectPaymentBanka"
          />
        </Form.Group>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onCancel} disabled={saving} data-cy="collectPaymentCancel">
          <Translate contentKey="entity.action.cancel">Cancel</Translate>
        </Button>
        <Button
          variant="success"
          id="confirm-collect-payment"
          data-cy="confirmCollectPayment"
          disabled={!paymentMethod || saving}
          onClick={() => paymentMethod && onConfirm(paymentMethod)}
        >
          <FontAwesomeIcon icon="money-check" /> <Translate contentKey="entity.action.confirmPayment">Confirm Payment</Translate>
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default CollectPaymentDialog;

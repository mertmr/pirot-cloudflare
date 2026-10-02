import React from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import ModalBody from 'react-bootstrap/ModalBody';
import ModalFooter from 'react-bootstrap/ModalFooter';
import ModalHeader from 'react-bootstrap/ModalHeader';
import Table from 'react-bootstrap/Table';
import { Translate } from 'react-jhipster';

const formatDiskSpaceOutput = rawValue => {
  // Should display storage space in a human readable unit
  const val = rawValue / 1073741824;
  if (val > 1) {
    // Value
    return `${val.toFixed(2)} GB`;
  }
  return `${(rawValue / 1048576).toFixed(2)} MB`;
};

const HealthModal = ({ handleClose, healthObject, showModal }) => {
  const data = healthObject.details || {};
  return (
    <Modal show={showModal} onHide={handleClose}>
      <ModalHeader closeButton>{healthObject.name}</ModalHeader>
      <ModalBody>
        <Table bordered>
          <thead>
            <tr>
              <th>
                <Translate contentKey="health.details.name">Name</Translate>
              </th>
              <th>
                <Translate contentKey="health.details.value">Value</Translate>
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(data).map((key, index) => (
              <tr key={index}>
                <td>{key}</td>
                <td>{healthObject.name === 'diskSpace' ? formatDiskSpaceOutput(data[key]) : JSON.stringify(data[key])}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" onClick={handleClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default HealthModal;

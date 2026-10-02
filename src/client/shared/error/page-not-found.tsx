import React from 'react';
import Alert from 'react-bootstrap/Alert';
import { Translate } from 'app/shared/jhipster/language';

const PageNotFound = () => {
  return (
    <div>
      <Alert variant="danger">
        <Translate contentKey="error.http.404">The page does not exist.</Translate>
      </Alert>
    </div>
  );
};

export default PageNotFound;

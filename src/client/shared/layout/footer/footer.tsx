import './footer.scss';

import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { Translate } from 'app/shared/jhipster/language';

const Footer = () => (
  <div className="footer page-content">
    <Row>
      <Col md="12">
        <p>
          <Translate contentKey="footer">Your footer</Translate>
        </p>
      </Col>
    </Row>
  </div>
);

export default Footer;

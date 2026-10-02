import React from 'react';
import NavItem from 'react-bootstrap/NavItem';
import NavLink from 'react-bootstrap/NavLink';
import NavbarBrand from 'react-bootstrap/NavbarBrand';
import { Translate } from 'app/shared/jhipster/language';
import { NavLink as Link } from 'app/shared/routing/navigation';

import { faHome } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export const BrandIcon = props => (
  <div {...props} className="brand-icon">
    <img src="/content/images/koop.svg" alt="Logo" />
  </div>
);

export const Brand = () => (
  <NavbarBrand as={Link} to="/" className="brand-logo">
    <BrandIcon />
    <span className="brand-title">
      <Translate contentKey="global.title">Koop</Translate>
    </span>
    <span className="navbar-version">{VERSION.toLowerCase().startsWith('v') ? VERSION : `v${VERSION}`}</span>
  </NavbarBrand>
);

export const Home = () => (
  <NavItem>
    <NavLink as={Link} to="/" eventKey="/" className="d-flex align-items-center">
      <FontAwesomeIcon icon={faHome} />
      <span>
        <Translate contentKey="global.menu.home">Home</Translate>
      </span>
    </NavLink>
  </NavItem>
);

import React from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownMenu from 'react-bootstrap/DropdownMenu';
import DropdownToggle from 'react-bootstrap/DropdownToggle';
import Nav from 'react-bootstrap/Nav';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export const NavDropdown = props => (
  <Dropdown as={Nav.Item} id={props.id} data-cy={props['data-cy']}>
    <DropdownToggle as={Nav.Link} className="d-flex align-items-center">
      <FontAwesomeIcon icon={props.icon} />
      <span>{props.name}</span>
    </DropdownToggle>
    <DropdownMenu renderOnMount align="end" style={props.style}>
      {props.children}
    </DropdownMenu>
  </Dropdown>
);

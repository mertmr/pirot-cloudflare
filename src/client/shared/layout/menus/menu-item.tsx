import React from 'react';
import DropdownItem from 'react-bootstrap/DropdownItem';
import { NavLink as Link } from 'app/shared/routing/navigation';

import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export interface IMenuItem {
  children: React.ReactNode;
  icon: IconProp;
  to: string;
  id?: string;
  'data-cy'?: string;
  onFocus?: React.FocusEventHandler<HTMLElement>;
  onMouseEnter?: React.MouseEventHandler<HTMLElement>;
  onPointerDown?: React.PointerEventHandler<HTMLElement>;
}

const MenuItem = (props: IMenuItem) => {
  const { to, icon, id, children, onFocus, onMouseEnter, onPointerDown } = props;

  return (
    <DropdownItem
      as={Link}
      to={to}
      eventKey={to}
      id={id}
      data-cy={props['data-cy']}
      onFocus={onFocus}
      onMouseEnter={onMouseEnter}
      onPointerDown={onPointerDown}
    >
      <FontAwesomeIcon icon={icon} /> {children}
    </DropdownItem>
  );
};

export default MenuItem;

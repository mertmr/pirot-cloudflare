import React from 'react';
import { Translate, translate } from 'app/shared/jhipster/language';

import { preloadSatisRoute } from 'app/entities/route-loaders';
import MenuItem from 'app/shared/layout/menus/menu-item';
import { NavDropdown } from './menu-components';

export interface IEntitiesMenuProps {
  isAdmin: boolean;
}

export const EntitiesMenu = ({ isAdmin }: IEntitiesMenuProps) => (
  <NavDropdown
    icon="th-list"
    name={translate('global.menu.entities.main')}
    id="entity-menu"
    data-cy="entity"
    style={{ maxHeight: '80vh', overflow: 'auto' }}
  >
    <MenuItem
      icon="money-check"
      to="/satis"
      onFocus={() => void preloadSatisRoute()}
      onMouseEnter={() => void preloadSatisRoute()}
      onPointerDown={() => void preloadSatisRoute()}
    >
      <Translate contentKey="global.menu.entities.satis" />
    </MenuItem>
    <MenuItem icon="hand-holding-usd" to="/virman">
      <Translate contentKey="global.menu.entities.virman" />
    </MenuItem>
    <MenuItem icon="wallet" to="/gider">
      <Translate contentKey="global.menu.entities.gider" />
    </MenuItem>
    <MenuItem icon="keyboard" to="/stok-girisi">
      <Translate contentKey="global.menu.entities.stokGirisi" />
    </MenuItem>
    <MenuItem icon="chalkboard-teacher" to="/nobet-hareketleri">
      <Translate contentKey="global.menu.entities.nobetHareketleri" />
    </MenuItem>
    {isAdmin && (
      <MenuItem icon="funnel-dollar" to="/kdv-kategorisi">
        <Translate contentKey="global.menu.entities.kdvKategorisi" />
      </MenuItem>
    )}
    <MenuItem icon="warehouse" to="/satis-stok-hareketleri">
      <Translate contentKey="global.menu.entities.satisStokHareketleri" />
    </MenuItem>
    <MenuItem icon="box-open" to="/urun">
      <Translate contentKey="global.menu.entities.urun" />
    </MenuItem>
    <MenuItem icon="people-carry" to="/uretici">
      <Translate contentKey="global.menu.entities.uretici" />
    </MenuItem>
    <MenuItem icon="cash-register" to="/kasa-hareketleri">
      <Translate contentKey="global.menu.entities.kasaHareketleri" />
    </MenuItem>
    {isAdmin && (
      <MenuItem icon="user" to="/kisiler">
        <Translate contentKey="global.menu.entities.kisiler" />
      </MenuItem>
    )}
    <MenuItem icon="calculator" to="/urun-fiyat-hesap">
      <Translate contentKey="global.menu.entities.urunFiyatHesap" />
    </MenuItem>
    <MenuItem icon="credit-card" to="/uretici-odemeleri">
      <Translate contentKey="global.menu.entities.ureticiOdemeleri" />
    </MenuItem>
    <MenuItem icon="money-check" to="/borc-alacak">
      <Translate contentKey="global.menu.entities.borcAlacak" />
    </MenuItem>
  </NavDropdown>
);

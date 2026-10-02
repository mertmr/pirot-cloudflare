import { Translate, translate } from 'app/shared/jhipster/language';

import MenuItem from 'app/shared/layout/menus/menu-item';
import { NavDropdown } from './menu-components';

export interface IReportsProps {
  isAdmin: boolean;
}

export const ReportsMenu = ({ isAdmin }: IReportsProps) => (
  <NavDropdown icon="th-list" name={translate('global.menu.reports.main')} id="report-menu">
    <MenuItem icon="asterisk" to="/reports/ciro">
      <Translate contentKey="global.menu.reports.ciro" />
    </MenuItem>
    <MenuItem icon="asterisk" to="/reports/aylikSatislar">
      Aylık Satışlar
    </MenuItem>
    {isAdmin && (
      <MenuItem icon="asterisk" to="/reports/aylikSatislarMali">
        Aylık Satışlar - Mali Birim
      </MenuItem>
    )}
    {isAdmin && (
      <MenuItem icon="asterisk" to="/reports/ortakFaturalar">
        Ortaklara Kesilen Faturalar
      </MenuItem>
    )}
    <MenuItem icon="asterisk" to="/reports/tukenme">
      Ürün Tükenme Hızı
    </MenuItem>
    <MenuItem icon="file" to="/reports/stock">
      <Translate contentKey="cloudflare.stockReports" />
    </MenuItem>
  </NavDropdown>
);

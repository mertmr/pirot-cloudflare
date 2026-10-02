import { ReducersMapObject } from '@reduxjs/toolkit';

import entitiesReducers from 'app/entities/reducers';
import activate from 'app/modules/account/activate/activate.reducer';
import password from 'app/modules/account/password/password.reducer';
import passwordReset from 'app/modules/account/password-reset/password-reset.reducer';
import register from 'app/modules/account/register/register.reducer';
import settings from 'app/modules/account/settings/settings.reducer';
import administration from 'app/modules/administration/administration.reducer';
import userManagement from 'app/modules/administration/user-management/user-management.reducer';
import loadingBar from 'app/shared/reducers/loading-bar';

import applicationProfile from './application-profile';
import authentication from './authentication';
import dashboardReportsState from './dashboard-reports.reducer';
import locale from './locale';

export type { IRootState } from 'app/config/store';

/* jhipster-needle-add-reducer-import - JHipster will add reducer here */

const rootReducer = {
  authentication,
  locale,
  applicationProfile,
  administration,
  userManagement,
  register,
  activate,
  passwordReset,
  password,
  settings,
  loadingBar,
  dashboardReportsState,
  /* jhipster-needle-add-reducer-combine - JHipster will add reducer here */
  ...entitiesReducers,
} satisfies ReducersMapObject;

export default rootReducer;

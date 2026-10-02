import { createFileRoute } from '@tanstack/react-router';
import { lazy } from 'react';
const Screen = lazy(() => import('../client/modules/administration/user-management/user-management-update'));
const PrivateRoute = lazy(() => import('../client/shared/auth/private-route'));
export const Route = createFileRoute('/_app/admin/user-management_/$login_/edit')({
  component: () => (
    <PrivateRoute hasAnyAuthorities={['ROLE_ADMIN']}>
      <Screen />
    </PrivateRoute>
  ),
});

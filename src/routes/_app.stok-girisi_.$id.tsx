import { createFileRoute } from '@tanstack/react-router';
import { lazy } from 'react';
const Screen = lazy(() => import('../client/entities/stok-girisi/stok-girisi-detail'));
const PrivateRoute = lazy(() => import('../client/shared/auth/private-route'));
export const Route = createFileRoute('/_app/stok-girisi_/$id')({
  component: () => (
    <PrivateRoute hasAnyAuthorities={['ROLE_USER']}>
      <Screen />
    </PrivateRoute>
  ),
});

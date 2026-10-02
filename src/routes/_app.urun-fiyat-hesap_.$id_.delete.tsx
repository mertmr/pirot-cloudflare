import { createFileRoute } from '@tanstack/react-router';
import { lazy } from 'react';
const Screen = lazy(() => import('../client/entities/urun-fiyat-hesap/urun-fiyat-hesap-delete-dialog'));
const PrivateRoute = lazy(() => import('../client/shared/auth/private-route'));
export const Route = createFileRoute('/_app/urun-fiyat-hesap_/$id_/delete')({
  component: () => (
    <PrivateRoute hasAnyAuthorities={['ROLE_USER']}>
      <Screen />
    </PrivateRoute>
  ),
});

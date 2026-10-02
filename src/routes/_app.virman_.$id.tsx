import { createFileRoute } from '@tanstack/react-router';
import { lazy } from 'react';
const Screen = lazy(() => import('../client/entities/virman/virman-detail'));
const PrivateRoute = lazy(() => import('../client/shared/auth/private-route'));
export const Route = createFileRoute('/_app/virman_/$id')({
  component: () => (
    <PrivateRoute hasAnyAuthorities={['ROLE_USER']}>
      <Screen />
    </PrivateRoute>
  ),
});

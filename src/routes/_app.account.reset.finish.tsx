import { createFileRoute } from '@tanstack/react-router';
import { lazy } from 'react';
const Screen = lazy(() => import('../client/modules/account/password-reset/finish/password-reset-finish'));
export const Route = createFileRoute('/_app/account/reset/finish')({ component: () => <Screen /> });

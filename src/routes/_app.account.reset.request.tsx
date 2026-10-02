import { createFileRoute } from '@tanstack/react-router';
import { lazy } from 'react';
const Screen = lazy(() => import('../client/modules/account/password-reset/init/password-reset-init'));
export const Route = createFileRoute('/_app/account/reset/request')({ component: () => <Screen /> });

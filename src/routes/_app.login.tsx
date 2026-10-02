import { createFileRoute } from '@tanstack/react-router';
import { lazy } from 'react';
const Screen = lazy(() => import('../client/modules/login/login'));
export const Route = createFileRoute('/_app/login')({ component: () => <Screen /> });

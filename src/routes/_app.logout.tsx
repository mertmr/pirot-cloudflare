import { createFileRoute } from '@tanstack/react-router';
import { lazy } from 'react';
const Screen = lazy(() => import('../client/modules/login/logout'));
export const Route = createFileRoute('/_app/logout')({ component: () => <Screen /> });

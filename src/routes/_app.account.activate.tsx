import { createFileRoute } from '@tanstack/react-router';
import { lazy } from 'react';
const Screen = lazy(() => import('../client/modules/account/activate/activate'));
export const Route = createFileRoute('/_app/account/activate')({ component: () => <Screen /> });

import { createFileRoute } from '@tanstack/react-router';
import { lazy } from 'react';
const Screen = lazy(() => import('../client/shared/error/page-not-found'));
export const Route = createFileRoute('/_app/$')({ component: () => <Screen /> });

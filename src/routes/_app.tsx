import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
const Pirot = lazy(() => import('../client-entry'));
export const Route = createFileRoute('/_app')({
  ssr: false,
  component: () => (
    <Suspense fallback={<div role="status">Pirot…</div>}>
      <Pirot />
    </Suspense>
  ),
});

import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
export const Route = createRootRoute({
  head: () => ({ meta: [{ charSet: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1' }, { title: 'Pirot' }] }),
  component: Root,
});
function Root() {
  return (
    <html lang="tr">
      <head>
        <base href="/" />
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}

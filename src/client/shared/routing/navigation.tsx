import { useLocation as useRouterLocation, useParams as useRouterParams, useRouter } from '@tanstack/react-router';
import React, { forwardRef, useCallback, useEffect, useMemo } from 'react';

export type NavigationTarget = string | { pathname?: string; search?: string; hash?: string };
export interface NavigationOptions {
  replace?: boolean;
  state?: Record<string, unknown>;
}
function targetHref(to: NavigationTarget, pathname: string): string {
  const value = typeof to === 'string' ? to : `${to.pathname ?? pathname}${to.search ?? ''}${to.hash ?? ''}`;
  if (value.startsWith('/') || /^[a-z][a-z\d+.-]*:/i.test(value)) return value;
  const url = new URL(value, `https://pirot.invalid${pathname.replace(/\/$/, '')}/`);
  return url.pathname + url.search + url.hash;
}
export function useLocation() {
  const location = useRouterLocation();
  return { ...location, search: location.searchStr, state: location.state as typeof location.state & { from?: NavigationTarget } };
}
export function useParams<Key extends string = string>(): Partial<Record<Key, string>> {
  const params = useRouterParams({ strict: false });
  return params as Partial<Record<Key, string>>;
}
export function useNavigate() {
  const router = useRouter();
  return useCallback(
    (to: NavigationTarget | number, options: NavigationOptions = {}) => {
      if (typeof to === 'number') {
        router.history.go(to);
        return;
      }
      return router.navigate({ href: targetHref(to, router.state.location.pathname), replace: options.replace, state: options.state });
    },
    [router],
  );
}
export function Navigate({ to, replace, state }: { to: NavigationTarget; replace?: boolean; state?: Record<string, unknown> }) {
  const navigate = useNavigate();
  const location = useRouterLocation();
  const destination = JSON.stringify({ href: targetHref(to, location.pathname), replace, state });
  useEffect(() => {
    const options = JSON.parse(destination) as NavigationOptions & { href: string };
    void navigate(options.href, options);
  }, [navigate, destination]);
  return null;
}
interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: NavigationTarget;
  replace?: boolean;
  state?: Record<string, unknown>;
  end?: boolean;
}
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(({ to, replace, state, onClick, ...props }, ref) => {
  const location = useRouterLocation();
  const navigate = useNavigate();
  const href = targetHref(to, location.pathname);
  return (
    <a
      {...props}
      ref={ref}
      href={href}
      onClick={event => {
        onClick?.(event);
        if (
          !event.defaultPrevented &&
          event.button === 0 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey &&
          (!props.target || props.target === '_self') &&
          !props.download
        ) {
          event.preventDefault();
          void navigate(href, { replace, state });
        }
      }}
    />
  );
});
export const NavLink = forwardRef<HTMLAnchorElement, LinkProps>(({ end, className, ...props }, ref) => {
  const location = useRouterLocation();
  const pathname = targetHref(props.to, location.pathname).split(/[?#]/)[0];
  const active = location.pathname === pathname || (!end && pathname !== '/' && location.pathname.startsWith(pathname + '/'));
  return (
    <Link
      {...props}
      ref={ref}
      className={[className, active ? 'active' : ''].filter(Boolean).join(' ')}
      aria-current={active ? 'page' : undefined}
    />
  );
});
export function useSearchParams() {
  const location = useRouterLocation();
  const navigate = useNavigate();
  const params = useMemo(() => new URLSearchParams(location.searchStr), [location.searchStr]);
  const setParams = useCallback(
    (value: URLSearchParams | Record<string, string>, options?: NavigationOptions) => {
      const query = new URLSearchParams(value).toString();
      void navigate({ search: query ? '?' + query : '' }, options);
    },
    [navigate],
  );
  return [params, setParams] as const;
}

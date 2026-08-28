'use client';

import NextLink from 'next/link';
import { useParams as useNextParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';

type LinkProps = Omit<ComponentProps<typeof NextLink>, 'href'> & {
  to: ComponentProps<typeof NextLink>['href'];
};

export function Link({ to, ...props }: LinkProps) {
  return <NextLink href={to} {...props} />;
}

export function useNavigate() {
  const router = useRouter();

  return (to: string | number, options?: { replace?: boolean }) => {
    if (typeof to === 'number') {
      window.history.go(to);
      return;
    }

    if (options?.replace) router.replace(to);
    else router.push(to);
  };
}

export function useLocation() {
  const pathname = usePathname();

  const [location, setLocation] = useState(() => ({
    pathname: pathname ?? '/',
    search: typeof window === 'undefined' ? '' : window.location.search,
    hash: typeof window === 'undefined' ? '' : window.location.hash,
    state: typeof window === 'undefined' ? null : window.history.state,
  }));

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const update = () => {
      setLocation({
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
        state: window.history.state,
      });
    };

    window.addEventListener('popstate', update);
    window.addEventListener('hashchange', update);

    return () => {
      window.removeEventListener('popstate', update);
      window.removeEventListener('hashchange', update);
    };
  }, []);

  return {
    pathname: location.pathname || pathname || '/',
    search: location.search,
    hash: location.hash,
    state: location.state,
  };
}

export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>() {
  const params = useNextParams();
  return params as T;
}

export function useSearchParams(): [
  URLSearchParams,
  (
    nextInit:
      | URLSearchParams
      | Record<string, string>
      | ((prev: URLSearchParams) => URLSearchParams | Record<string, string>),
    options?: { replace?: boolean },
  ) => void,
] {
  const router = useRouter();
  const pathname = usePathname();
  const [params, setParams] = useState<URLSearchParams>(() =>
    typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.search),
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const update = () => setParams(new URLSearchParams(window.location.search));
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, []);

  const setSearchParams = (
    nextInit:
      | URLSearchParams
      | Record<string, string>
      | ((prev: URLSearchParams) => URLSearchParams | Record<string, string>),
    options?: { replace?: boolean },
  ) => {
    const currentParams = params;
    const nextValue = typeof nextInit === 'function' ? nextInit(currentParams) : nextInit;
    const nextParams = nextValue instanceof URLSearchParams ? nextValue : new URLSearchParams(nextValue);
    const query = nextParams.toString();
    const href = query ? `${pathname}?${query}` : pathname;

    setParams(nextParams);

    if (options?.replace) router.replace(href);
    else router.push(href);
  };

  return [params, setSearchParams];
}

export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  const navigate = useNavigate();
  navigate(to, { replace });
  return null;
}

export function Outlet() {
  return null;
}

export function RouterProvider() {
  return null;
}

export function createBrowserRouter() {
  return {};
}

export function SuspenseOutlet({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

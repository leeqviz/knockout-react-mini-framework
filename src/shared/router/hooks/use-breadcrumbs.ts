import { useMemo } from 'react';
import { useRouter } from './use-router';

export interface Breadcrumb {
  label: string;
  path: string;
  isCurrent: boolean;
}

export function useBreadcrumbs(): Breadcrumb[] {
  const { location, route, resolveRoute } = useRouter<{
    breadcrumb?: string;
  }>();

  return useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean);

    return segments.map((_, i) => {
      const path = '/' + segments.slice(0, i + 1).join('/');
      const matched = resolveRoute(path);
      return {
        label: matched?.meta?.breadcrumb ?? segments[i] ?? '',
        path,
        isCurrent: i === segments.length - 1,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, route.meta, resolveRoute]);
}

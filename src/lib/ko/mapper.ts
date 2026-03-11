import type { RouterContextValue } from '@/lib/react/contexts/routing';
import { appRouter } from './router';

export function mapRouterData(): RouterContextValue {
  return {
    navigate: (path: string, options?: { replace?: boolean | undefined }) =>
      appRouter.navigate(path, options),
    params: appRouter.currentParams(),
    location: {
      pathname: appRouter.currentPathname(),
      search: appRouter.currentSearch(),
    },
    setSearchParams: (newParams: Record<string, string>) => {
      appRouter.setSearchParams(newParams);
    },
  };
}

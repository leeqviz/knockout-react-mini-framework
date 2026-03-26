import { useCallback } from 'react';
import type { NavigateOptions, RouteParams, RouteSearchParams } from '../types';
import { useRouter } from './use-router';

export function useNavigate() {
  const { navigate, navigateExternal, back, forward, go, generatePath } =
    useRouter();

  const navigateTo = useCallback(
    (
      name: string,
      params?: RouteParams,
      searchParams?: RouteSearchParams,
      hash?: string,
      options?: NavigateOptions,
    ) => navigate(generatePath(name, params, searchParams, hash), options),
    [navigate, generatePath],
  );

  return {
    navigateTo,
    navigate,
    navigateExternal,
    back,
    forward,
    go,
  };
}

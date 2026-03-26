import { useCallback, useMemo } from 'react';
import type { NavigateOptions } from '../types';
import { useRouter } from './use-router';
import { useSearchParams } from './use-search-params';

export function useQueryParam(
  key: string,
): [string | null, (value: string | null, options?: NavigateOptions) => void] {
  const [, actions] = useSearchParams();
  const { location } = useRouter();

  const value = useMemo(
    () => new URLSearchParams(location.search).get(key),
    [location.search, key],
  );

  const setValue = useCallback(
    (v: string | null, options?: NavigateOptions) => {
      if (v === null) actions.delete(key, undefined, options);
      else actions.set(key, v, options);
    },
    [key, actions],
  );

  return [value, setValue];
}

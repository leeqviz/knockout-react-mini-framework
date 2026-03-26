import { useCallback, useMemo } from 'react';
import type { NavigateOptions } from '../types';
import { useRouter } from './use-router';
import { useSearchParams } from './use-search-params';

export function useQueryParams<T extends Record<string, string | null>>(
  keys: (keyof T & string)[],
): [T, (patch: Partial<T>, options?: NavigateOptions) => void] {
  const [, actions] = useSearchParams();
  const { location } = useRouter();

  const values = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return Object.fromEntries(keys.map((k) => [k, params.get(k)])) as T;
  }, [location.search, keys]);

  const setValues = useCallback(
    (patch: Partial<T>, options?: NavigateOptions) => {
      actions.patch(patch as Record<string, string | null>, options);
    },
    [actions],
  );

  return [values, setValues];
}

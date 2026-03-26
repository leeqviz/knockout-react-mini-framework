import { useCallback, useMemo } from 'react';
import type { NavigateOptions } from '../types';
import { useRouter } from './use-router';
import { useSearchParams } from './use-search-params';

export interface SearchParamStateOptions<T> {
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
  replace?: boolean;
}

export function useSearchParamState<T = string>(
  key: string,
  defaultValue: T,
  options: SearchParamStateOptions<T> = {},
): [T, (value: T, navOptions?: NavigateOptions) => void] {
  const {
    serialize = String,
    deserialize = (v) => v as unknown as T,
    replace = true,
  } = options;

  const [, actions] = useSearchParams();
  const { location } = useRouter();

  const raw = useMemo(
    () => new URLSearchParams(location.search).get(key),
    [location.search, key],
  );

  const value = useMemo(
    () => (raw !== null ? deserialize(raw) : defaultValue),
    [raw, deserialize, defaultValue],
  );

  const setValue = useCallback(
    (v: T, navOptions?: NavigateOptions) => {
      actions.set(key, serialize(v), { replace, ...navOptions });
    },
    [key, serialize, replace, actions],
  );

  return [value, setValue];
}

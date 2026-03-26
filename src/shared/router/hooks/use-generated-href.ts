import { useMemo } from 'react';
import type { RouteParams, RouteSearchParams } from '../types';
import { useRouter } from './use-router';

export function useGeneratedHref(
  name: string,
  params?: RouteParams,
  searchParams?: RouteSearchParams,
  hash?: string,
): string {
  const { generatePath } = useRouter();
  return useMemo(
    () => generatePath(name, params, searchParams, hash),
    [generatePath, name, params, searchParams, hash],
  );
}

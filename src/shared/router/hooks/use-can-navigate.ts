import { useMemo } from 'react';
import { useRouter } from './use-router';

export function useCanNavigate(path: string): boolean {
  const { resolveRoute } = useRouter();
  return useMemo(() => resolveRoute(path) !== null, [resolveRoute, path]);
}

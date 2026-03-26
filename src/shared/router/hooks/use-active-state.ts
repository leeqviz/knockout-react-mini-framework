import { useMemo } from 'react';
import { useRouter } from './use-router';

export interface ActiveState {
  isActive: boolean;
  isExact: boolean;
  isPending: boolean;
}

export function useActiveState(path: string): ActiveState {
  const { isActive, isExact, isNavigating, pendingLocation } = useRouter();

  return useMemo(
    () => ({
      isActive: isActive(path),
      isExact: isExact(path),
      isPending:
        isNavigating && isActive(path) && pendingLocation?.pathname === path,
    }),
    [path, isActive, isExact, isNavigating, pendingLocation],
  );
}

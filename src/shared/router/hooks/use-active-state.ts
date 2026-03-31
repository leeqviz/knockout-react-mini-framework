import { useMemo } from 'react';
import { useRouter } from './use-router';

export interface ActiveState {
  isActive: boolean;
  isExact: boolean;
  isPending: boolean;
}

export function useActiveState(path: string): ActiveState {
  const { routeAPI, locationAPI } = useRouter();

  return useMemo(
    () => ({
      isActive: routeAPI.isActive(path),
      isExact: routeAPI.isExact(path),
      isPending:
        locationAPI.isPending &&
        routeAPI.isActive(path) &&
        locationAPI.pendingLocation?.pathname === path,
    }),
    [path, routeAPI, locationAPI],
  );
}

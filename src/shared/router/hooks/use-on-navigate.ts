import { useEffect, useRef } from 'react';
import type { RouteState } from '../types';
import { useRouter } from './use-router';

export function useOnNavigate(
  callback: (to: RouteState, from: RouteState | null) => void,
  deps: React.DependencyList = [],
) {
  const { location, route } = useRouter();
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  });

  const prevStateRef = useRef<{
    location: typeof location;
    route: typeof route;
  } | null>(null);

  useEffect(() => {
    const prev = prevStateRef.current;
    if (prev !== null) {
      callbackRef.current(
        { ...location, ...route } as RouteState,
        prev as unknown as RouteState,
      );
    }
    prevStateRef.current = { location, route };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search, location.hash, ...deps]);
}

import { useEffect, useId, useRef } from 'react';
import type { BlockerAction, BlockerState, NavigationLocation } from '../types';
import { useRouter } from './use-router';

export interface Blocker {
  state: BlockerState;
  location: NavigationLocation | null;
  proceed: () => void;
  reset: () => void;
}

export function useBlocker<
  TMeta extends Record<string, unknown> = Record<string, unknown>,
>(shouldBlock: boolean | BlockerAction<TMeta>): Blocker {
  const { locationAPI } = useRouter<TMeta>();
  const id = useId();

  const shouldBlockRef = useRef(shouldBlock);
  useEffect(() => {
    shouldBlockRef.current = shouldBlock;
  });

  useEffect(() => {
    locationAPI.setBlocker(id, (to, from) => {
      const fn = shouldBlockRef.current;
      return typeof fn === 'function' ? fn(to, from) : fn;
    });
    return () => locationAPI.setBlocker(id, null);
  }, [locationAPI, id]);

  return {
    state: locationAPI.blockerState,
    location: locationAPI.blockedLocation,
    proceed: locationAPI.proceedBlocked,
    reset: locationAPI.resetBlocked,
  };
}

import { useEffect, useRef } from 'react';
import type {
  BlockerFunction,
  BlockerState,
  NavigationLocation,
} from '../types';
import { useRouter } from './use-router';

export interface Blocker {
  state: BlockerState;
  location: NavigationLocation | null;
  proceed: () => void;
  reset: () => void;
}

type ShouldBlock<TMeta extends Record<string, unknown>> =
  | boolean
  | BlockerFunction<TMeta>;

export function useBlocker<
  TMeta extends Record<string, unknown> = Record<string, unknown>,
>(shouldBlock: ShouldBlock<TMeta>): Blocker {
  const router = useRouter<TMeta>();

  const shouldBlockRef = useRef(shouldBlock);
  useEffect(() => {
    shouldBlockRef.current = shouldBlock;
  });

  useEffect(() => {
    router.setBlocker((to, from) => {
      const fn = shouldBlockRef.current;
      return typeof fn === 'function' ? fn(to, from) : fn;
    });
    return () => router.setBlocker(null);
  }, [router]);

  return {
    state: router.blockerState,
    location: router.blockedTo,
    proceed: router.proceedBlocked,
    reset: router.resetBlocked,
  };
}

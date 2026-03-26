import { useRef } from 'react';
import type { RouterSnapshot } from '../types';
import { useRouter } from './use-router';

export function useRouterSelector<T>(
  selector: (snapshot: RouterSnapshot) => T,
  equals: (a: T, b: T) => boolean = Object.is,
): T {
  const router = useRouter();
  const selected = selector(router);

  const ref = useRef(selected);
  // eslint-disable-next-line react-hooks/refs
  if (!equals(ref.current, selected)) {
    // eslint-disable-next-line react-hooks/refs
    ref.current = selected;
  }

  // eslint-disable-next-line react-hooks/refs
  return ref.current;
}

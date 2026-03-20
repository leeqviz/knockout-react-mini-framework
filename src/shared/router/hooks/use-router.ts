import { useContext } from 'react';
import { RouterContext } from '../lib';
import type { RouterSnapshot } from '../types';

export function useRouter(): RouterSnapshot {
  const context = useContext(RouterContext);

  if (!context) throw new Error('Router context is empty');

  return context;
}

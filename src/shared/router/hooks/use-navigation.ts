import type { NavigationLocation } from '../types';
import { useRouter } from './use-router';

export type NavigationState = 'idle' | 'loading';

export interface Navigation {
  state: NavigationState;
  location: NavigationLocation | null;
}

export function useNavigation(): Navigation {
  const { isPending, pendingLocation } = useRouter().locationAPI;

  return {
    state: isPending ? 'loading' : 'idle',
    location: pendingLocation,
  };
}

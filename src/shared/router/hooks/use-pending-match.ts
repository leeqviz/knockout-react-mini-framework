import { toPath } from '../utils';
import { useRouter } from './use-router';

export function usePendingMatch(path: string): boolean {
  const { isNavigating, pendingLocation, isActive } = useRouter();

  if (!isNavigating || !pendingLocation) return false;

  const targetPath = toPath(path);
  return isActive(targetPath);
}

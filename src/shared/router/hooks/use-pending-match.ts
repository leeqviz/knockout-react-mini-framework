import { toPath } from '../utils';
import { useRouter } from './use-router';

export function usePendingMatch(path: string): boolean {
  const { locationAPI, routeAPI } = useRouter();

  if (!locationAPI.isPending || !locationAPI.pendingLocation) return false;

  const targetPath = toPath(path);
  return routeAPI.isActive(targetPath);
}

import type { To } from '../types';
import { resolveTo, toPath } from '../utils';
import { useRouter } from './use-router';

export function useResolvedPath(to: To): {
  pathname: string;
  search: string;
  hash: string;
} {
  const { location } = useRouter();
  const url = resolveTo(toPath(to), location.pathname, location.search);
  return { pathname: url.pathname, search: url.search, hash: url.hash };
}

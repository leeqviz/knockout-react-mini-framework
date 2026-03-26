import { useRouter } from './use-router';

export function useRouteState<T = unknown>(): T | null {
  return (useRouter().location.state ?? null) as T | null;
}

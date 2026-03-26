import { useCallback } from 'react';
import { useRouter } from './use-router';

export function usePrefetch() {
  const { resolveRoute } = useRouter();

  return useCallback(
    (path: string) => {
      const route = resolveRoute(path);
      if (!route) return;

      const apiBase = (route.meta as unknown as { apiBase?: string })?.apiBase;
      if (apiBase) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = apiBase;
        document.head.appendChild(link);
      }
    },
    [resolveRoute],
  );
}

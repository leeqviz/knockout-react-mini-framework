import { useEffect } from 'react';

export function useBeforeUnload(
  fn: (event: BeforeUnloadEvent) => void,
  deps: React.DependencyList = [],
) {
  useEffect(() => {
    window.addEventListener('beforeunload', fn);
    return () => window.removeEventListener('beforeunload', fn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

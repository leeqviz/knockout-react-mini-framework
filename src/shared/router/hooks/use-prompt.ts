import { useCallback } from 'react';
import { useBlocker } from './use-blocker';

export function usePrompt(message: string, when: boolean) {
  useBlocker(
    useCallback(() => {
      if (!when) return false;
      return !window.confirm(message);
    }, [when, message]),
  );
}

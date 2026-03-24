import { useEffect } from 'react';
import { useBlocker } from '../hooks';

export function Prompt({ when, message }: { when: boolean; message: string }) {
  const blocker = useBlocker(when);

  useEffect(() => {
    if (blocker.state === 'blocked') {
      if (window.confirm(message)) blocker.proceed();
      else blocker.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocker.state]);

  return null;
}

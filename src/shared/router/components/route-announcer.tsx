import { useEffect, useState } from 'react';
import { useRouter } from '../hooks';

export function RouteAnnouncer() {
  const { route, location } = useRouter();
  const [message, setMessage] = useState('');

  useEffect(() => {
    const title = document.title || route.name || location.pathname;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessage(`Navigated to ${title}`);
  }, [location.pathname, route.name]);

  return (
    <div
      aria-live="assertive"
      aria-atomic="true"
      style={{
        position: 'absolute',
        width: 1,
        height: 1,
        overflow: 'hidden',
        clip: 'rect(0,0,0,0)',
      }}
    >
      {message}
    </div>
  );
}

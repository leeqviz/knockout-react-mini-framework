import { useState } from 'react';
import { useRouter } from '../hooks';

export function RouterDevTools() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (process.env['NODE_ENV'] !== 'development') return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 9999,
        fontFamily: 'monospace',
        fontSize: 12,
      }}
    >
      <button onClick={() => setOpen((o) => !o)}>🔀 Router</button>

      {open && (
        <pre
          style={{
            background: '#1e1e1e',
            color: '#d4d4d4',
            padding: 12,
            borderRadius: 8,
            maxWidth: 400,
            overflow: 'auto',
          }}
        >
          {JSON.stringify(
            {
              pathname: router.location.pathname,
              search: router.location.search,
              hash: router.location.hash,
              name: router.route.name,
              pattern: router.route.pattern,
              params: router.params,
              navigationType: router.navigationType,
              isNavigating: router.isNavigating,
              blockerState: router.blockerState,
              meta: router.route.meta,
            },
            null,
            2,
          )}
        </pre>
      )}
    </div>
  );
}

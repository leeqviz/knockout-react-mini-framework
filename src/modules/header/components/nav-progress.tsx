import { useNavigation } from '@/shared/router';
import { useEffect, useRef, useState } from 'react';

export function NavProgress() {
  const { state } = useNavigation();
  const isLoading = state === 'loading';

  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (isLoading) {
      hasStarted.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
      setWidth(0);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setWidth(70));
      });
    } else if (hasStarted.current) {
      setWidth(100);
      timerRef.current = setTimeout(() => {
        setVisible(false);
        setWidth(0);
        hasStarted.current = false;
      }, 300);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isLoading]);

  if (!visible) return null;

  return (
    <div
      role="progressbar"
      aria-label="Page loading"
      aria-valuenow={width}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '2px',
        width: `${width}%`,
        background: 'var(--color-primary)',
        transition:
          width === 100
            ? 'width 100ms ease-out, opacity 200ms 150ms ease'
            : 'width 500ms cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: width === 100 ? 0 : 1,
        zIndex: 9999,
        transformOrigin: 'left',
      }}
    />
  );
}

import { useCallback } from 'react';
import type { LinkRenderState } from '../types';
import { type LinkProps, Link } from './link';

export function NavLink({ className, ...props }: LinkProps) {
  const resolvedClassName = useCallback(
    ({ isActive, isExact, isPending }: LinkRenderState): string | undefined => {
      if (typeof className === 'function')
        return className({ isActive, isExact, isPending });

      const classes = [className];
      if (isActive) classes.push('active');
      if (isExact) classes.push('exact');

      return classes.filter(Boolean).join(' ') || undefined;
    },
    [className],
  );

  return <Link className={resolvedClassName} {...props} />;
}

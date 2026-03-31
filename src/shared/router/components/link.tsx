import React, {
  useCallback,
  useMemo,
  type AnchorHTMLAttributes,
  type RefObject,
} from 'react';
import { useRouter } from '../hooks';
import type { LinkRenderState, To } from '../types';
import { isModifiedEvent, toPath } from '../utils';

export interface LinkProps extends Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'href' | 'className'
> {
  to: To;
  reloadDocument?: boolean | undefined;
  replace?: boolean | undefined;
  state?: unknown;
  className?: string | ((state: LinkRenderState) => string | undefined);
  external?: boolean;
  allowAnyProtocol?: boolean;
  disabled?: boolean;
  ref?: RefObject<HTMLAnchorElement | null>;
}

export function Link({
  to,
  replace = false,
  reloadDocument = false,
  state,
  external = false,
  allowAnyProtocol = false,
  disabled = false,
  className,
  onClick,
  children,
  target,
  ref,
  ...rest
}: LinkProps) {
  const router = useRouter();

  const isActive = !external && router.routeAPI.isActive(toPath(to));
  const isExact = !external && router.routeAPI.isExact(toPath(to));
  const isPending = router.locationAPI.isPending;

  const href = useMemo(() => {
    if (external) return toPath(to);
    try {
      return router.routeAPI.createHref(toPath(to));
    } catch {
      return toPath(to);
    }
  }, [to, external, router]);

  const resolvedClassName = useMemo(() => {
    if (typeof className === 'function') {
      return className({ isActive, isExact, isPending }) || undefined;
    }
    return className || undefined;
  }, [className, isActive, isExact, isPending]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (reloadDocument) return;
      onClick?.(e);

      if (
        e.defaultPrevented ||
        disabled ||
        e.button !== 0 || // only left clicks
        isModifiedEvent(e) || // Ctrl/Meta/Shift/Alt will be handled by the browser
        target === '_blank'
      ) {
        return;
      }

      e.preventDefault();

      if (external) {
        router.locationAPI.navigateExternal(toPath(to), {
          target,
          allowAnyProtocol,
        });
        return;
      }

      router.locationAPI.navigate(toPath(to), {
        replace,
        state: state ?? null,
      });
    },
    [
      onClick,
      disabled,
      target,
      external,
      to,
      replace,
      state,
      allowAnyProtocol,
      router,
      reloadDocument,
    ],
  );

  return (
    <a
      ref={ref}
      href={disabled ? undefined : href}
      className={resolvedClassName}
      aria-current={
        !external && router.routeAPI.isExact(toPath(to)) ? 'page' : undefined
      }
      onClick={handleClick}
      target={target}
      aria-disabled={disabled || undefined}
      {...rest}
    >
      {children}
    </a>
  );
}

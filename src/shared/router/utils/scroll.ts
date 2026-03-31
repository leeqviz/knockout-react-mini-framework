import type { ScrollBehaviorMeta, ScrollBehaviorOptions } from '../types';

export function scrollToTarget(
  options: ScrollToOptions | boolean | null,
): void {
  if (!options || typeof options === 'boolean') return;
  requestAnimationFrame(() => {
    window.scrollTo(options);
  });
}

export function scrollToFragment(
  hash: string,
  options: ScrollIntoViewOptions | boolean | null,
): void {
  if (!hash) return;
  requestAnimationFrame(() => {
    const id = hash.startsWith('#') ? hash.slice(1) : hash;
    if (!id) return;

    if (id === 'top')
      window.scrollTo({
        top: 0,
        left: 0,
        behavior:
          typeof options === 'boolean' ? 'auto' : options?.behavior || 'auto',
      });
    else {
      const el =
        document.getElementById(id) ??
        document.querySelector<HTMLElement>(`[name="${id}"]`);

      if (!el) return;
      el.scrollIntoView(options ?? { behavior: 'auto' });
    }
  });
}

export function defaultScrollBehaviorResolver<
  TMeta extends Record<string, unknown> = Record<string, unknown>,
>(meta?: ScrollBehaviorMeta<TMeta> | undefined): ScrollBehaviorOptions | null {
  if (meta?.options) return meta.options;
  return { top: 0, left: 0, behavior: 'smooth' };
}

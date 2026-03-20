import type { ScrollBehaviorFn, ScrollTarget } from '../types';

export function applyScrollTarget(target: ScrollTarget): void {
  if (!target || target === 'preserve') return;

  requestAnimationFrame(() => {
    if (target === 'top') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      return;
    }
    window.scrollTo({ top: target.y, left: target.x, behavior: 'instant' });
  });
}

export function scrollToFragment(hash: string): void {
  const id = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!id) return;

  if (id === 'top') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  const el =
    document.getElementById(id) ??
    document.querySelector<HTMLElement>(`[name="${id}"]`);

  el?.scrollIntoView({ behavior: 'smooth' });
}

export function scheduleScrollToFragment(hash: string): void {
  if (!hash) return;
  requestAnimationFrame(() => scrollToFragment(hash));
}

export const defaultScrollBehavior: ScrollBehaviorFn = (
  _to,
  _from,
  savedPosition,
) => {
  if (savedPosition) return savedPosition;
  return 'top';
  /* Custom 
      if (savedPosition) return savedPosition;           
      if (to.hash) return null;                          
      if (to.meta?.scrollMode === 'preserve') return 'preserve'; 
      return 'top';
    */
};

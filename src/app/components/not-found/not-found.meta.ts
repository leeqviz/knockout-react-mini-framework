import type { KnockoutComponentMeta } from '@/shared/lib/ko';
import { notFoundComponent } from './not-found.component';

export const notFoundComponentMeta: KnockoutComponentMeta = {
  name: 'not-found-component',
  component: notFoundComponent,
};

export const notFoundLazyComponentMeta: KnockoutComponentMeta = {
  name: 'not-found-lazy-component',
  lazy: () =>
    import('./not-found.component').then((res) => ({
      default: res.notFoundComponent,
    })),
};

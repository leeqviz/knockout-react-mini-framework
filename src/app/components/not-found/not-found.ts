import type { KnockoutComponentMeta } from '@/shared/lib/ko';
import { notFoundComponent } from './not-found.component';
import type { NotFoundViewModel } from './not-found.model';

export const notFoundComponentMeta: KnockoutComponentMeta<
  typeof NotFoundViewModel
> = {
  name: 'not-found-component',
  component: notFoundComponent,
};

export const notFoundLazyComponentMeta: KnockoutComponentMeta<
  typeof NotFoundViewModel
> = {
  name: 'not-found-lazy-component',
  lazy: () =>
    import('./not-found.component').then((res) => ({
      default: res.notFoundComponent,
    })),
};

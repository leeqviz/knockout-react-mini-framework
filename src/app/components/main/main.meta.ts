import type { KnockoutComponentMeta } from '@/shared/lib/ko';
import { mainComponent } from './main.component';

export const mainComponentMeta: KnockoutComponentMeta = {
  name: 'main-component',
  component: mainComponent,
};

export const mainLazyComponentMeta: KnockoutComponentMeta = {
  name: 'main-lazy-component',
  lazy: () =>
    import('./main.component').then((res) => ({
      default: res.mainComponent,
    })),
};

import type { KnockoutComponentMeta } from '@/shared/lib/ko';
import { mainComponent } from './main.component';
import type { MainViewModel } from './main.model';

export const mainComponentMeta: KnockoutComponentMeta<typeof MainViewModel> = {
  name: 'main-component',
  component: mainComponent,
};

export const mainLazyComponentMeta: KnockoutComponentMeta<
  typeof MainViewModel
> = {
  name: 'main-lazy-component',
  lazy: () =>
    import('./main.component').then((res) => ({
      default: res.mainComponent,
    })),
};

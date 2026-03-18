import type { KnockoutComponentMeta } from '@/shared/lib/ko';
import { datepickerComponent } from './datepicker.component';
import type { DatepickerViewModel } from './datepicker.model';

export const datepickerComponentMeta: KnockoutComponentMeta<
  typeof DatepickerViewModel
> = {
  name: 'datepicker-component',
  component: datepickerComponent,
};

export const datepickerLazyComponentMeta: KnockoutComponentMeta<
  typeof DatepickerViewModel
> = {
  name: 'datepicker-lazy-component',
  lazy: () =>
    import('./datepicker.component').then((res) => ({
      default: res.datepickerComponent,
    })),
};

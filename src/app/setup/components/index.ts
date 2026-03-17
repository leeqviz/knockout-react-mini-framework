import { ko } from '@/shared/lib/ko';
import { notFoundComponent } from '@/shared/router';
import { datepickerComponent } from './datepicker';
import { mainComponent } from './main';

export function setupComponents() {
  ko.components.register('not-found-component', notFoundComponent);
  ko.components.register('main-component', mainComponent);
  ko.components.register('datepicker-component', datepickerComponent);

  ko.components.register('main-lazy-component', {
    lazy: () =>
      import('@/app/setup/components/main').then((res) => ({
        default: res.mainComponent,
      })),
  });
  ko.components.register('datepicker-lazy-component', {
    lazy: () =>
      import('@/app/setup/components/datepicker').then((res) => ({
        default: res.datepickerComponent,
      })),
  });
}

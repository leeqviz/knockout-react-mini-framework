import type { ReactBindingOptions } from '@/app/bindings';
import {
  ReactComponentWithRouterViewModel,
  type ReactComponentWithRouterViewModelParams,
} from '@/app/models';
import {
  DatepickerEntryPointLazy,
  type DatepickerEntryPointProps,
} from '@/modules/datepicker';

export class DatepickerViewModel extends ReactComponentWithRouterViewModel {
  public bindingOptions: ReactBindingOptions<DatepickerEntryPointProps>;

  public constructor(params: ReactComponentWithRouterViewModelParams) {
    super(params);
    this.bindingOptions = {
      component: DatepickerEntryPointLazy,
      props: this.computedProps(),
    };
  }
}

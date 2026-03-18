import {
  ReactComponentWithRouterViewModel,
  type ReactComponentWithRouterViewModelParams,
} from '@/app/models';
import {
  DatepickerEntryPointLazy,
  type DatepickerEntryPointProps,
} from '@/modules/datepicker';
import type { ComponentType } from 'react';

export class DatepickerViewModel extends ReactComponentWithRouterViewModel {
  public component: ComponentType<DatepickerEntryPointProps>;

  public constructor(params: ReactComponentWithRouterViewModelParams) {
    super(params);
    this.component = DatepickerEntryPointLazy;
  }
}

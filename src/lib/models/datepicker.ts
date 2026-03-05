import {
  DatepickerEntryPointLazy,
  type DatepickerEntryPointProps,
} from '@/modules/datepicker';
import type { ComponentType } from 'react';

export class DatepickerViewModel {
  datepickerComponent: ComponentType<DatepickerEntryPointProps>;

  constructor() {
    this.datepickerComponent = DatepickerEntryPointLazy;
  }
}

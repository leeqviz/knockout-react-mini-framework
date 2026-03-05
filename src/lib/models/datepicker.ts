import {
  DatepickerEntryPointLazy,
  type DatepickerEntryPointProps,
} from '@/modules/datepicker';
import type { ComponentType } from 'react';
import type { AppViewModel } from './app';

export class DatepickerViewModel {
  public props: DatepickerEntryPointProps;
  public component: ComponentType<DatepickerEntryPointProps>;

  constructor(params: { globals: AppViewModel }) {
    this.props = {
      date: params.globals.globalDate(),
      setDate: params.globals.setGlobalDate,
    };
    this.component = DatepickerEntryPointLazy;
  }
}

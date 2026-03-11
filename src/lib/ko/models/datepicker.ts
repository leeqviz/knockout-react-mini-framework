import {
  DatepickerEntryPointLazy,
  type DatepickerEntryPointProps,
} from '@/modules/datepicker';
import ko from 'knockout';
import type { ComponentType } from 'react';
import { mapRouterData } from '../mapper';

export class DatepickerViewModel {
  public computedProps: KnockoutComputed<DatepickerEntryPointProps>;
  public component: ComponentType<DatepickerEntryPointProps>;

  constructor(params: { withRouter?: boolean | undefined }) {
    // pureComputed guarantees that the function will only be called when the observable changes
    this.computedProps = ko.pureComputed(() => ({
      router: params.withRouter ? mapRouterData() : null,
    }));
    this.component = DatepickerEntryPointLazy;
  }

  public dispose() {}
}

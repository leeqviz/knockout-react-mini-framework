import {
  DatepickerEntryPointLazy,
  type DatepickerEntryPointProps,
} from '@/modules/datepicker';
import type { ComponentType } from 'react';
import { ko } from '../globals';
import { appRouter } from '../router/app';

export class DatepickerViewModel {
  public computedProps: KnockoutComputed<DatepickerEntryPointProps>;
  public component: ComponentType<DatepickerEntryPointProps>;

  public constructor(params: { withRouter?: boolean | undefined }) {
    // pureComputed guarantees that the function will only be called when the observable changes
    this.computedProps = ko.pureComputed(() => ({
      router: params.withRouter ? appRouter.mapRouterData() : null,
    }));
    this.component = DatepickerEntryPointLazy;
  }

  public dispose() {}
}

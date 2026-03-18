import { appRouter } from '@/app/router';
import {
  DatepickerEntryPointLazy,
  type DatepickerEntryPointProps,
} from '@/modules/datepicker';
import { ko, type ReactComponentViewModelParams } from '@/shared/lib/ko';
import type { ComponentType } from 'react';

export class DatepickerViewModel {
  public computedProps: KnockoutComputed<DatepickerEntryPointProps>;
  public component: ComponentType<DatepickerEntryPointProps>;

  public constructor(params: ReactComponentViewModelParams) {
    // pureComputed guarantees that the function will only be called when the observable changes
    this.computedProps = ko.pureComputed(() => ({
      router: params.withRouter ? appRouter.getSnapshot() : null,
    }));
    this.component = DatepickerEntryPointLazy;
  }

  public dispose() {}
}

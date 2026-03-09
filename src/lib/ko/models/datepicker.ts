import {
  DatepickerEntryPointLazy,
  type DatepickerEntryPointProps,
} from '@/modules/datepicker';
import ko from 'knockout';
import type { ComponentType } from 'react';
import type { AppViewModel } from './app';

export class DatepickerViewModel {
  public computedProps: KnockoutComputed<DatepickerEntryPointProps>;
  public component: ComponentType<DatepickerEntryPointProps>;

  constructor(params: { globals: AppViewModel }) {
    // pureComputed guarantees that the function will only be called when the observable changes
    this.computedProps = ko.pureComputed(() => ({
      router: params.globals
        ? {
            navigate: (
              path: string,
              options?: { replace?: boolean | undefined },
            ) => params.globals.navigate(path, options),
            params: params.globals.currentRouteParams(),
            location: {
              pathname: params.globals.currentPathname(),
              search: params.globals.currentSearch(),
            },
            setSearchParams: (newParams: Record<string, string>) => {
              params.globals.setSearchParams(newParams);
            },
          }
        : null,
    }));
    this.component = DatepickerEntryPointLazy;
  }

  public dispose() {}
}

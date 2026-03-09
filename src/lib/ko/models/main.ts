import { MainEntryPointLazy, type MainEntryPointProps } from '@/modules/main';
import ko from 'knockout';
import type { ComponentType } from 'react';
import type { AppViewModel } from './app';

export class MainViewModel {
  public computedProps: KnockoutComputed<MainEntryPointProps>;
  public component: ComponentType<MainEntryPointProps>;

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
    this.component = MainEntryPointLazy;
  }

  public dispose() {}
}

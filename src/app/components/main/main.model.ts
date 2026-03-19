import type { ReactBindingOptions } from '@/app/bindings';
import {
  ReactComponentWithRouterViewModel,
  type ReactComponentWithRouterViewModelParams,
} from '@/app/models';
import { MainEntryPointLazy, type MainEntryPointProps } from '@/modules/main';

export class MainViewModel extends ReactComponentWithRouterViewModel {
  public bindingOptions: ReactBindingOptions<MainEntryPointProps>;

  public constructor(params: ReactComponentWithRouterViewModelParams) {
    super(params);
    this.bindingOptions = {
      component: MainEntryPointLazy,
      props: this.computedProps(),
    };
  }
}

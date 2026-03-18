import {
  ReactComponentWithRouterViewModel,
  type ReactComponentWithRouterViewModelParams,
} from '@/app/models';
import { MainEntryPointLazy, type MainEntryPointProps } from '@/modules/main';
import type { ComponentType } from 'react';

export class MainViewModel extends ReactComponentWithRouterViewModel {
  public component: ComponentType<MainEntryPointProps>;

  public constructor(params: ReactComponentWithRouterViewModelParams) {
    super(params);
    this.component = MainEntryPointLazy;
  }
}

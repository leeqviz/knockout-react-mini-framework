import { MainEntryPointLazy, type MainEntryPointProps } from '@/modules/main';
import type { ComponentType } from 'react';
import type { AppViewModel } from './app';

export class MainViewModel {
  public props: MainEntryPointProps;
  public component: ComponentType<MainEntryPointProps>;

  constructor(params: { globals: AppViewModel }) {
    this.props = {
      count: params.globals.globalCount(),
      setCount: params.globals.setGlobalCount,
    };
    this.component = MainEntryPointLazy;
  }
}

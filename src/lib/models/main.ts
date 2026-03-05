import { MainEntryPointLazy, type MainEntryPointProps } from '@/modules/main';
import type { ComponentType } from 'react';

export class MainViewModel {
  mainComponent: ComponentType<MainEntryPointProps>;

  constructor() {
    this.mainComponent = MainEntryPointLazy;
  }
}

import { ko } from '@/lib/ko/globals';
import { MainEntryPointLazy, type MainEntryPointProps } from '@/modules/main';
import type { ComponentType } from 'react';
import { mapRouterData } from '../mapper';

export class MainViewModel {
  public computedProps: KnockoutComputed<MainEntryPointProps>;
  public component: ComponentType<MainEntryPointProps>;

  constructor(params: { withRouter?: boolean | undefined }) {
    // pureComputed guarantees that the function will only be called when the observable changes
    this.computedProps = ko.pureComputed(() => ({
      router: params.withRouter ? mapRouterData() : null,
    }));
    this.component = MainEntryPointLazy;
  }

  public dispose() {}
}

import { MainEntryPointLazy, type MainEntryPointProps } from '@/modules/main';
import type { ComponentType } from 'react';
import { ko } from '../globals';
import { appRouter } from '../router/app';

export class MainViewModel {
  public computedProps: KnockoutComputed<MainEntryPointProps>;
  public component: ComponentType<MainEntryPointProps>;

  public constructor(params: { withRouter?: boolean | undefined }) {
    // pureComputed guarantees that the function will only be called when the observable changes
    this.computedProps = ko.pureComputed(() => ({
      router: params.withRouter ? appRouter.mapRouterData() : null,
    }));
    this.component = MainEntryPointLazy;
  }

  public dispose() {}
}

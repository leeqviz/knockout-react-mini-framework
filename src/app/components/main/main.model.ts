import { appRouter } from '@/app/router';
import { MainEntryPointLazy, type MainEntryPointProps } from '@/modules/main';
import { ko, type ReactComponentViewModelParams } from '@/shared/lib/ko';
import type { ComponentType } from 'react';

export class MainViewModel {
  public computedProps: KnockoutComputed<MainEntryPointProps>;
  public component: ComponentType<MainEntryPointProps>;

  public constructor(params: ReactComponentViewModelParams) {
    // pureComputed guarantees that the function will only be called when the observable changes
    this.computedProps = ko.pureComputed(() => ({
      router: params.withRouter ? appRouter.getSnapshot() : null,
    }));
    this.component = MainEntryPointLazy;
  }

  public dispose() {}
}

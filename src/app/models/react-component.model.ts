import { ko } from '@/shared/lib/ko';
import type { RouterSnapshot } from '@/shared/router';
import type { ComponentType } from 'react';
import { appRouter } from '../router';
import { BaseViewModel } from './base.model';

type ReactComponentProps = {
  [key: string]: unknown;
};

export abstract class ReactComponentViewModel<
  T = ReactComponentProps,
> extends BaseViewModel {
  public abstract computedProps: KnockoutComputed<T>;
  public abstract component: ComponentType<T>;

  public constructor() {
    super();
  }

  public dispose() {
    this.computedProps.dispose();
  }
}

export interface ReactComponentWithRouterViewModelParams {
  withRouter?: boolean | undefined;
}

type ReactComponentPropsWithRouter = ReactComponentProps & {
  router: RouterSnapshot | null;
};

export abstract class ReactComponentWithRouterViewModel extends ReactComponentViewModel<ReactComponentPropsWithRouter> {
  public computedProps: KnockoutComputed<ReactComponentPropsWithRouter>;

  public constructor(params: ReactComponentWithRouterViewModelParams) {
    super();
    // pureComputed guarantees that the function will only be called when the observable changes
    this.computedProps = ko.pureComputed(() => ({
      router: params.withRouter ? appRouter.getSnapshot() : null,
    }));
  }
}

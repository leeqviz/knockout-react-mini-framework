import { ko } from '@/shared/lib/ko';
import type { RouterSnapshot } from '@/shared/router';
import type { ReactBindingOptions } from '../bindings';
import { appRouter } from '../router';
import { BaseViewModel } from './base.model';

interface ReactComponentProps {
  [key: string]: unknown;
}

export abstract class ReactComponentViewModel<
  T = ReactComponentProps,
> extends BaseViewModel {
  protected abstract computedProps: KnockoutComputed<T>;
  public abstract bindingOptions: ReactBindingOptions<T>;

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

interface ReactComponentPropsWithRouter extends ReactComponentProps {
  router: RouterSnapshot | null;
}

export abstract class ReactComponentWithRouterViewModel extends ReactComponentViewModel<ReactComponentPropsWithRouter> {
  protected computedProps: KnockoutComputed<ReactComponentPropsWithRouter>;

  public constructor(params: ReactComponentWithRouterViewModelParams) {
    super();
    // pureComputed guarantees that the function will only be called when the observable changes
    this.computedProps = ko.pureComputed(
      (): ReactComponentPropsWithRouter => ({
        router: params.withRouter ? appRouter.getSnapshot() : null,
      }),
    );
  }
}

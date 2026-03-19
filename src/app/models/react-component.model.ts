import type { RouterSnapshot } from '@/shared/router';
import type { ReactBindingOptions } from '../bindings';
import { appRouter } from '../router';
import { BaseViewModel } from './base.model';

export abstract class ReactComponentViewModel<
  T extends object = Record<string, unknown>,
> extends BaseViewModel {
  protected abstract props: T;
  public abstract bindingOptions: KnockoutComputed<ReactBindingOptions<T>>;

  public constructor() {
    super();
  }

  public dispose = () => {
    this.bindingOptions.dispose();
  };
}

export interface ReactComponentWithRouterViewModelParams {
  props: Record<string, unknown>;
  withRouter?: boolean | undefined;
}

export abstract class ReactComponentWithRouterViewModel<
  T extends object & { router: RouterSnapshot | null },
> extends ReactComponentViewModel<T> {
  protected props: T;

  public constructor(params: ReactComponentWithRouterViewModelParams) {
    super();
    this.props = {
      router: params.withRouter ? appRouter.getSnapshot() : null,
      ...params.props,
    } as T;
  }
}

import type {
  KnockoutObservableArrayWithDispose,
  KnockoutObservableWithDispose,
  ZustandSyncConfig,
} from './types';

declare global {
  interface Window {
    ko: KnockoutStatic; //typeof import('knockout');
  }
  interface KnockoutExtenders {
    [name: string]: unknown;
    localStorageSync<T>(
      target:
        | KnockoutObservableWithDispose<T>
        | KnockoutObservableArrayWithDispose<T>,
      key: string,
    ): KnockoutObservableWithDispose<T> | KnockoutObservableArrayWithDispose<T>;
    zustandSync<TState, TSlice>(
      target:
        | KnockoutObservableWithDispose<TSlice>
        | KnockoutObservableArrayWithDispose<TSlice>,
      options: ZustandSyncConfig<TState, TSlice>,
    ):
      | KnockoutObservableWithDispose<TSlice>
      | KnockoutObservableArrayWithDispose<TSlice>;
  }
  interface KnockoutObservableArray<T>
    extends KnockoutObservable<T[]>, KnockoutObservableArrayFunctions<T> {
    extend(
      requestedExtenders: Partial<KnockoutExtenders>,
    ): KnockoutObservableArray<T>;
  }
  interface KnockoutObservable<T> extends KnockoutReadonlyObservable<T> {
    extend(
      requestedExtenders: Partial<KnockoutExtenders>,
    ): KnockoutObservable<T>;
  }
  interface KnockoutComputed<T>
    extends
      KnockoutReadonlyComputed<T>,
      KnockoutObservable<T>,
      KnockoutComputedFunctions<T> {
    extend(requestedExtenders: Partial<KnockoutExtenders>): KnockoutComputed<T>;
  }
  interface KnockoutSubscribable<T> extends KnockoutSubscribableFunctions<T> {
    extend(
      requestedExtenders: Partial<KnockoutExtenders>,
    ): KnockoutSubscribable<T>;
  }
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace KnockoutComponentTypes {
    interface Config<T> {
      viewModel?: T | undefined;
      lazy?:
        | (() => Promise<{
            default?: Config<T> | undefined;
          }>)
        | undefined;
    }
    interface ComponentConfig<T> {
      viewModel?: T | undefined;
      lazy?:
        | (() => Promise<{
            default?: ComponentConfig<T> | undefined;
          }>)
        | undefined;
    }
  }
}

export const ko = window.ko;

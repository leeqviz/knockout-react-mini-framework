import type {
  KnockoutObservableArrayWithDispose,
  KnockoutObservableWithDispose,
  StoreSyncConfig,
} from './types';

declare global {
  interface Window {
    ko: KnockoutStatic; //typeof import('knockout');
  }
  interface KnockoutExtenders {
    localStorageSync<T>(
      target:
        | KnockoutObservableWithDispose<T>
        | KnockoutObservableArrayWithDispose<T>,
      key: string,
    ): KnockoutObservableWithDispose<T> | KnockoutObservableArrayWithDispose<T>;
    storeSync<TState, TSlice>(
      target:
        | KnockoutObservableWithDispose<TSlice>
        | KnockoutObservableArrayWithDispose<TSlice>,
      options: StoreSyncConfig<TState, TSlice>,
    ):
      | KnockoutObservableWithDispose<TSlice>
      | KnockoutObservableArrayWithDispose<TSlice>;
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
export type {
  KnockoutObservableArrayWithDispose,
  KnockoutObservableWithDispose,
  StoreSyncConfig,
} from './types';

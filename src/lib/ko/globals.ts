import type { StoreApi } from 'zustand';

export interface StoreSyncConfig<TState, TSlice> {
  store: StoreApi<TState>;
  selector: (state: TState) => TSlice;
  setter?: (newValue: TSlice) => Partial<TState> | void;
}

export interface StoreSyncArrayConfig<TState, TSlice> {
  store: StoreApi<TState>;
  selector: (state: TState) => TSlice[];
  setter?: ((newValue: TSlice[]) => Partial<TState> | void) | undefined;
}

export type KnockoutObservableWithDispose<T> = KnockoutObservable<T> & {
  dispose?: () => void;
};
export type KnockoutObservableArrayWithDispose<T> =
  KnockoutObservableArray<T> & {
    dispose?: () => void;
  };

declare global {
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

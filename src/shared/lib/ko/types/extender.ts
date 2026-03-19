import type { StoreApi } from 'zustand';

export interface ZustandSyncConfig<TState, TSlice> {
  store: StoreApi<TState>;
  selector: (state: TState) => TSlice;
  setter?: (newValue: TSlice) => Partial<TState> | void;
}

export type KnockoutObservableWithDispose<T> = KnockoutObservable<T> & {
  dispose?: () => void;
};

export type KnockoutObservableArrayWithDispose<T> =
  KnockoutObservableArray<T> & {
    dispose?: () => void;
  };

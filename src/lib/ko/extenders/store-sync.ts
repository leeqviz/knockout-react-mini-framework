import type { StoreSyncConfig } from '@/lib/ko/globals';

export function storeSync<TState, TSlice>(
  target: KnockoutObservable<TSlice>,
  options: StoreSyncConfig<TState, TSlice>,
): KnockoutObservable<TSlice> & { dispose: () => void } {
  const { store, selector, setter } = options;

  let isSynchronizing = false;
  const initialState = selector(store.getState());
  if (JSON.stringify(target()) !== JSON.stringify(initialState)) {
    target(initialState);
  }

  // Zustand -> Knockout
  const unsubscribe = store.subscribe((state: TState, prevState: TState) => {
    const newValue = selector(state);
    const oldValue = selector(prevState);

    if (
      JSON.stringify(newValue) !== JSON.stringify(oldValue) &&
      JSON.stringify(target()) !== JSON.stringify(newValue)
    ) {
      isSynchronizing = true;
      target(newValue);
      isSynchronizing = false;
    }
  });

  // Knockout -> Zustand
  const subscription = target.subscribe((newValue: TSlice) => {
    if (isSynchronizing) {
      return;
    }

    const currentState = store.getState();
    const currentSliceValue = selector(currentState);

    if (JSON.stringify(newValue) !== JSON.stringify(currentSliceValue)) {
      if (setter) {
        const stateUpdate = setter(newValue);
        if (stateUpdate) {
          store.setState(stateUpdate);
        }
      } else {
        console.warn(' Mutated read-only observable without a setter.', target);
      }
    }
  });

  (target as KnockoutObservable<TSlice> & { dispose: () => void }).dispose =
    function () {
      unsubscribe();
      subscription.dispose();
    };

  return target as KnockoutObservable<TSlice> & { dispose: () => void };
}

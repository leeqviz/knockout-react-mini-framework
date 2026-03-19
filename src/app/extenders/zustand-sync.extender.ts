import type {
  KnockoutObservableArrayWithDispose,
  KnockoutObservableWithDispose,
  ZustandSyncConfig,
} from '@/shared/lib/ko';

export function zustandSync<TState, TSlice>(
  target:
    | KnockoutObservableWithDispose<TSlice>
    | KnockoutObservableArrayWithDispose<TSlice>,
  options: ZustandSyncConfig<TState, TSlice>,
):
  | KnockoutObservableWithDispose<TSlice>
  | KnockoutObservableArrayWithDispose<TSlice> {
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
  const subscription = target.subscribe(
    (newValue: TSlice) => {
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
          console.warn(
            ' Mutated read-only observable without a setter.',
            target,
          );
        }
      }
    },
    null,
    'change',
  );

  target.dispose = function () {
    unsubscribe();
    subscription.dispose();
  };

  return target;
}

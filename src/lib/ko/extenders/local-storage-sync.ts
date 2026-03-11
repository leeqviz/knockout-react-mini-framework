import type {
  KnockoutObservableArrayWithDispose,
  KnockoutObservableWithDispose,
} from '../globals';

export function localStorageSync<T>(
  target:
    | KnockoutObservableWithDispose<T>
    | KnockoutObservableArrayWithDispose<T>,
  key: string,
): KnockoutObservableWithDispose<T> | KnockoutObservableArrayWithDispose<T> {
  const value = localStorage.getItem(key);

  if (value !== null) {
    try {
      target(JSON.parse(value));
    } catch (e) {
      console.error('Error parsing local storage value ', e);
    }
  }

  const subscription = target.subscribe(
    function (newValue: T) {
      localStorage.setItem(key, JSON.stringify(newValue));
    },
    null,
    'change',
  );

  target.dispose = function () {
    localStorage.removeItem(key);
    subscription.dispose();
  };

  return target;
}

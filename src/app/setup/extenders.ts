import { localStorageSync, zustandSync } from '@/app/extenders';
import ko from 'knockout';

const extenders = {
  localStorageSync,
  zustandSync,
};

export function setupExtenders() {
  Object.entries(extenders).forEach(([name, extender]) => {
    ko.extenders[name] = extender;
  });
}

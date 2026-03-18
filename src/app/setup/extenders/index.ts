import { localStorageSync, storeSync } from '@/app/extenders';
import { ko } from '@/shared/lib/ko';

const extenders = {
  localStorageSync,
  storeSync,
};

export function setupExtenders() {
  Object.entries(extenders).forEach(([name, extender]) => {
    ko.extenders[name] = extender;
  });
}

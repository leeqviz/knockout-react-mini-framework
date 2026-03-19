import { localStorageSync, zustandSync } from '@/app/extenders';
import { ko } from '@/shared/lib/ko';

const extenders = {
  localStorageSync,
  zustandSync,
};

export function setupExtenders() {
  Object.entries(extenders).forEach(([name, extender]) => {
    ko.extenders[name] = extender;
  });
}

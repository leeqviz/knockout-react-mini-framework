import { ko } from '@/shared/lib/ko';
import { localStorageSync } from './local-storage.extender';
import { storeSync } from './zustand.extender';

export function setupExtenders() {
  ko.extenders.storeSync = storeSync;
  ko.extenders.localStorageSync = localStorageSync;
}

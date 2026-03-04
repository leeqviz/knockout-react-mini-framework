import { appStore, type AppState } from '@/stores/app';
import { useStore } from 'zustand';

export function useAppStore<T>(selector: (state: AppState) => T): T {
  return useStore(appStore, selector);
}

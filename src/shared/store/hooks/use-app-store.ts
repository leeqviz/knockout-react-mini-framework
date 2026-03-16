import { useStore } from 'zustand';
import { appStore } from '..';
import type { AppState } from '../types';

export function useAppStore<T>(selector: (state: AppState) => T): T {
  return useStore(appStore, selector);
}

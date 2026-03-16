import { createStore } from 'zustand/vanilla';
import { initialAppStateData } from './constants';
import type { AppState } from './types';

export const appStore = createStore<AppState>((set) => ({
  ...initialAppStateData,
  reset: () => set(initialAppStateData),

  setCount: (value) => set({ count: value }),
  setDate: (value) => set({ date: value }),
  addUser: (name) =>
    set((state) => ({
      users: [...state.users, { id: Date.now(), name }],
    })),
  setTheme: (value) => set({ theme: value }),
}));

export * from './constants';
export * from './hooks';
export * from './types';

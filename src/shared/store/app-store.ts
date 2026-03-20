import { createStore } from 'zustand/vanilla';
import type { AppState } from './types';
import { initialAppStateData } from './utils';

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

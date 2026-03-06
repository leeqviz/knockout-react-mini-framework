import type { User } from '@/types/user';
import { subscribeWithSelector } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

export interface AppState {
  users: User[];
  addUser: (name: string) => void;
  theme: 'light' | 'dark';
  setTheme: (newTheme: 'light' | 'dark') => void;
}

// Vanilla JS Zustand store
export const appStore = createStore<AppState>()(
  subscribeWithSelector((set) => ({
    users: [{ id: 1, name: 'Test' }],
    addUser: (name) =>
      set((state) => ({
        users: [...state.users, { id: Date.now(), name }],
      })),
    theme: 'light',
    setTheme: (newTheme) => set({ theme: newTheme }),
  })),
);

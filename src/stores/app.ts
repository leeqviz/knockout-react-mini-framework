import type { User } from '@/types/user';
import { getCurrentISODate } from '@/utils/mappers/date';
import { createStore } from 'zustand/vanilla';

export interface AppState {
  isAuth: boolean;
  // Count
  count: number;
  setCount: (value: number) => void;
  // Date
  date: string;
  setDate: (value: string) => void;
  // Users
  users: User[];
  addUser: (name: string) => void;
  // Theme
  theme: 'light' | 'dark';
  setTheme: (value: 'light' | 'dark') => void;
}

// Vanilla JS Zustand store
export const appStore = createStore<AppState>((set) => ({
  isAuth: false,
  count: 0,
  setCount: (value) => set({ count: value }),
  date: getCurrentISODate(),
  setDate: (value) => set({ date: value }),
  users: [{ id: 1, name: 'Test' }],
  addUser: (name) =>
    set((state) => ({
      users: [...state.users, { id: Date.now(), name }],
    })),
  theme: 'light',
  setTheme: (value) => set({ theme: value }),
}));

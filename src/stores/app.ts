import type { User } from '@/types/user';
import { getCurrentISODate } from '@/utils/mappers/date';
import { createStore } from 'zustand/vanilla';

export interface AppStateData {
  isAuth: boolean;
  user: User | null;
  count: number;
  date: string;
  users: User[];
  theme: 'light' | 'dark';
}

export interface AppStateActions {
  reset: () => void;

  setCount: (value: number) => void;
  setDate: (value: string) => void;
  addUser: (name: string) => void;
  setTheme: (value: 'light' | 'dark') => void;
}

export type AppState = AppStateData & AppStateActions;

export const initialAppStateData: AppStateData = {
  isAuth: false,
  user: null,
  count: 0,
  date: getCurrentISODate(),
  users: [{ id: 1, name: 'Test' }],
  theme: 'light',
};

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

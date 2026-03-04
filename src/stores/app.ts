import type { User } from '@/types/user';
import { createStore } from 'zustand/vanilla';

// Описываем состояние
export interface AppState {
  users: User[];
  addUser: (name: string) => void;
}

// Создаем "ванильный" стор (без привязки к React)
export const appStore = createStore<AppState>((set) => ({
  users: [{ id: 1, name: 'Иван' }],
  addUser: (name) =>
    set((state) => ({
      users: [...state.users, { id: Date.now(), name }],
    })),
}));

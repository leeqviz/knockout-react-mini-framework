import type { Theme, User } from '@/shared/types';

export interface AppStateData {
  isAuth: boolean;
  user: User | null;
  count: number;
  date: string;
  users: User[];
  theme: Theme;
}

export interface AppStateActions {
  reset: () => void;

  setCount: (value: number) => void;
  setDate: (value: string) => void;
  addUser: (name: string) => void;
  setTheme: (value: Theme) => void;
}

export type AppState = AppStateData & AppStateActions;

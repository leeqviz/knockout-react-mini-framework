import { getCurrentISODate } from '@/shared/utils/mappers';
import type { AppStateData } from '../types';

export const initialAppStateData: AppStateData = {
  isAuth: false,
  user: null,
  count: 0,
  date: getCurrentISODate(),
  users: [{ id: 1, name: 'Test' }],
  theme: 'light',
};

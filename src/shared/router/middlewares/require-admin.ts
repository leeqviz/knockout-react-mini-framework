import { appStore } from '@/shared/store';
import type { RouteMiddleware } from '../types';

export const requireAdmin: RouteMiddleware = () => {
  const user = appStore.getState().user;
  if (!user?.roles?.includes('admin')) {
    return '/403';
  }
  return true;
};

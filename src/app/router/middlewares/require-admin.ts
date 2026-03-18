import type { RouteMiddleware } from '@/shared/router';
import { appStore } from '@/shared/store';

export const requireAdmin: RouteMiddleware = () => {
  const user = appStore.getState().user;
  if (!user?.roles?.includes('admin')) {
    return '/403';
  }
  return true;
};

import type { RouteMiddleware, RouteMiddlewareResult } from '@/shared/router';
import { appStore } from '@/shared/store';

export const requireAdmin: RouteMiddleware = (): RouteMiddlewareResult => {
  const user = appStore.getState().user;
  if (!user?.roles?.includes('admin')) {
    return { type: 'redirect', to: '/403' };
  }
};

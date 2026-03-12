import { appStore } from '@/stores/app';
import type { RouteMiddleware, RouteMiddlewareContext } from './router';

export const requireAuth: RouteMiddleware = (
  context: RouteMiddlewareContext,
) => {
  const isAuth = appStore.getState().isAuth;
  if (!isAuth) {
    console.warn(
      `Access to ${context.fullPath} is denied, user is not authenticated`,
    );

    const redirectUrl = encodeURIComponent(context.fullPath);

    context.navigate(`/login?redirectTo=${redirectUrl}`);
    return false;
  }
  return true;
};

export const requireAdmin: RouteMiddleware = () => {
  const user = appStore.getState().user;
  if (!user?.roles?.includes('admin')) {
    return '/403';
  }
  return true;
};

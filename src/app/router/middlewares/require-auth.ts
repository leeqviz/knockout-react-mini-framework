import type { RouteMiddleware, RouteMiddlewareContext } from '@/shared/router';
import { appStore } from '@/shared/store';

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

import type {
  RouteMiddleware,
  RouteMiddlewareContext,
  RouteMiddlewareResult,
} from '@/shared/router';
import { appStore } from '@/shared/store';

export const requireAuth: RouteMiddleware = (
  context: RouteMiddlewareContext,
): RouteMiddlewareResult => {
  const isAuth = appStore.getState().isAuth;
  if (!isAuth) {
    console.warn(
      `Access to ${context.fullPath} is denied, user is not authenticated`,
    );

    const redirectUrl = encodeURIComponent(context.fullPath);

    return { type: 'redirect', to: `/login?redirectTo=${redirectUrl}` };
  }
};

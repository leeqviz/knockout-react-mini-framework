import { BaseRouter, type RouterOptions } from '@/shared/router';
import { appRoutes } from './constants';

export class AppRouter extends BaseRouter {
  private static instance: AppRouter | null = null;

  private constructor(options: RouterOptions) {
    super(options);
  }

  public static getInstance(options: RouterOptions): AppRouter {
    if (!AppRouter.instance) {
      AppRouter.instance = new AppRouter(options);
    }

    return AppRouter.instance;
  }
}

export const appRouter = AppRouter.getInstance({
  routes: appRoutes,
});

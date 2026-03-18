import { BaseRouter, type RouterOptions } from '@/shared/router';
import { datepickerComponentMeta } from '../components/datepicker';
import { mainComponentMeta } from '../components/main';
import { notFoundComponentMeta } from '../components/not-found';
import { requireAuth } from './middlewares';

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
  notFoundComponent: notFoundComponentMeta.name,
  routes: [
    { pattern: '/', component: mainComponentMeta.name },
    {
      pattern: '/test',
      component: datepickerComponentMeta.name,
      middlewares: [requireAuth],
    },
    { pattern: '/users/:id', component: 'user-component' },
    { pattern: '/docs/*', component: 'docs-catch-all' },
    { pattern: '/:lang?/about', component: 'about-component' },
    { pattern: '/files/:path*', component: 'file-viewer' },
  ],
});

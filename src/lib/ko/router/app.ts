import { BaseRouter, type RouteConfig, type RouterOptions } from '.';
import { requireAuth } from '../middlewares';

export class ApplicationRouter extends BaseRouter {
  private static instance: ApplicationRouter | null = null;

  private constructor(options?: RouterOptions) {
    super(options);
  }

  public static getInstance(options?: RouterOptions): ApplicationRouter {
    if (!ApplicationRouter.instance) {
      ApplicationRouter.instance = new ApplicationRouter(options);
    }

    return ApplicationRouter.instance;
  }

  protected override getDefaultRoutes(): RouteConfig[] {
    return [
      { pattern: '/', component: 'main-component' },
      {
        pattern: '/test',
        component: 'datepicker-component',
        middlewares: [requireAuth],
      },
      { pattern: '/users/:id', component: 'user-component' },
      { pattern: '/docs/*', component: 'docs-catch-all' },
      { pattern: '/:lang?/about', component: 'about-component' },
      { pattern: '/files/:path*', component: 'file-viewer' },
    ];
  }

  protected override getDefaultNotFoundComponent(): string {
    return 'not-found-component';
  }
}

export const appRouter = ApplicationRouter.getInstance();

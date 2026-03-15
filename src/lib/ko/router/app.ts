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
    // TODO: make components to be not hardcoded and add nested routes, route ranking, wildcard-маршрутов, optional params and async middleware
    return [
      { pattern: '/', component: 'main-component' },
      {
        pattern: '/test',
        component: 'datepicker-component',
        middlewares: [requireAuth],
      },
      { pattern: '/test/:userId', component: 'user-profile-widget' },
      {
        pattern: '/test/:userId/posts/:postId',
        component: 'post-detail-widget',
      },
    ];
  }

  protected override getDefaultNotFoundComponent(): string {
    return 'not-found-component';
  }
}

export const appRouter = ApplicationRouter.getInstance();

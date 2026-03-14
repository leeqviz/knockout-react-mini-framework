import { BaseRouter, type RouteConfig } from '.';
import { requireAuth } from '../middlewares';

export class ApplicationRouter extends BaseRouter {
  private static instance: ApplicationRouter | null = null;

  private constructor() {
    super();
  }

  public static getInstance(): ApplicationRouter {
    if (!ApplicationRouter.instance) {
      ApplicationRouter.instance = new ApplicationRouter();
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
    ];
  }

  protected override getDefaultNotFoundComponent(): string {
    return 'not-found-component';
  }
}

export const appRouter = ApplicationRouter.getInstance();

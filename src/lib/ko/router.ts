import { ko } from '@/lib/ko/globals';
import { requireAuth } from './middlewares';

export interface RouteMiddlewareContext {
  navigate: (path: string, options?: { replace?: boolean | undefined }) => void;
  fullPath: string;
}

export type RouteMiddleware = (
  context: RouteMiddlewareContext,
) => boolean | string;

export interface RouteConfig {
  pattern: string;
  component: string;
  middlewares?: RouteMiddleware[] | undefined;
}

export interface RouterOptions {
  routes?: RouteConfig[] | undefined;
  middlewares?: RouteMiddleware[] | undefined;
  notFoundComponent?: string | undefined;
}

export class ApplicationRouter {
  private static instance: ApplicationRouter | null;

  private routes: RouteConfig[];
  private notFoundComponent: string;
  public currentComponent: KnockoutObservable<string>;
  public currentParams: KnockoutObservable<Record<string, string>>;
  public currentPathname: KnockoutObservable<string>;
  public currentSearch: KnockoutObservable<string>;

  private constructor(options?: RouterOptions) {
    this.start = this.start.bind(this);
    this.dispose = this.dispose.bind(this);
    this.handlePopState = this.handlePopState.bind(this);
    this.navigate = this.navigate.bind(this);
    this.handlePath = this.handlePath.bind(this);
    this.setSearchParams = this.setSearchParams.bind(this);

    this.routes = options?.routes || [
      // order is important
      { pattern: '/', component: 'main-component' },
      {
        pattern: '/test',
        component: 'datepicker-component',
        middlewares: [requireAuth],
      },
      /* { pattern: '/test/settings', component: 'users-settings-widget' }, 
        { pattern: '/test/:userId', component: 'user-profile-widget' },
        { pattern: '/test/:userId/posts/:postId', component: 'post-detail-widget' } */
    ];
    this.notFoundComponent =
      options?.notFoundComponent || 'not-found-component';
    this.currentComponent = ko.observable<string>(
      this.routes.find((r) => r.pattern === '/')?.component ||
        this.notFoundComponent,
    );
    this.currentParams = ko.observable<Record<string, string>>({});
    this.currentPathname = ko.observable(window.location.pathname);
    this.currentSearch = ko.observable('');
  }

  public static getInstance() {
    if (!ApplicationRouter.instance) {
      ApplicationRouter.instance = new ApplicationRouter();
    }
    return ApplicationRouter.instance;
  }

  public start() {
    window.addEventListener('popstate', this.handlePopState);
    this.handlePath(window.location.pathname + window.location.search);
  }

  public dispose() {
    window.removeEventListener('popstate', this.handlePopState);
  }

  private handlePopState() {
    this.handlePath(window.location.pathname + window.location.search);
  }

  public navigate(path: string, options?: { replace?: boolean | undefined }) {
    if (window.location.pathname + window.location.search !== path) {
      if (options?.replace) window.history.replaceState({}, '', path);
      else window.history.pushState({}, '', path);
      this.handlePath(path);
    }
  }

  private handlePath(fullPath: string) {
    const [path, queryString] = fullPath.split('?');
    if (queryString) {
      this.currentSearch('?' + queryString);
    }

    const normalizedPath = path
      ? path.endsWith('/') && path.length > 1
        ? path.slice(0, -1)
        : path
      : '';
    this.currentPathname(normalizedPath);

    const queryParams = queryString
      ? Object.fromEntries(new URLSearchParams(queryString))
      : {};

    for (const route of this.routes) {
      const paramNames: string[] = [];

      const regexPattern = route.pattern
        .replace(/:([^\\/]+)/g, (_, paramName) => {
          paramNames.push(paramName);
          return '([a-zA-Z0-9_-]+)';
        })
        .replace(/\//g, '\\/');

      const regex = new RegExp(`^${regexPattern}$`);
      const match = normalizedPath.match(regex);

      if (match) {
        for (const middleware of route.middlewares || []) {
          const result = middleware({ navigate: this.navigate, fullPath });
          if (typeof result === 'string') {
            this.navigate(result);
            return;
          }
        }

        /*
         // 1. Находим нужный маршрут (ваш код парсинга)
        const matchedRoute = this.findRoute(fullPath); 

        if (matchedRoute) {
            // 2. ЗАПУСКАЕМ ГВАРДЫ, ЕСЛИ ОНИ ЕСТЬ
            if (matchedRoute.guards && matchedRoute.guards.length > 0) {
                for (const guard of matchedRoute.guards) {
                    const result = guard(); // Вызываем проверку
                    
                    if (result === false) {
                        return; // Молча прерываем маршрутизацию
                    }
                    
                    if (typeof result === 'string') {
                        // Это редирект! Вызываем navigate с заменой истории
                        this.navigate(result, { replace: true });
                        return; // Прерываем текущую маршрутизацию
                    }
                }
            }

            // 3. Если все гварды вернули true, делаем переход
            this.currentComponent(matchedRoute.component);
            // this.currentParams(...);
            this.currentPath(fullPath);
        } else {
            // Обработка 404
            this.currentComponent('not-found-widget');
        }
         */

        const paramValues = match.slice(1);

        const dynamicParams = paramNames.reduce(
          (acc, name, index) => {
            acc[name] = paramValues[index] || '';
            return acc;
          },
          {} as Record<string, string>,
        );

        const allParams = { ...queryParams, ...dynamicParams };

        this.currentComponent(route.component);
        this.currentParams(allParams);
        return;
      }
    }

    this.currentComponent(this.notFoundComponent);
    this.currentParams({ ...queryParams });
  }

  public setSearchParams(newParams: Record<string, string>) {
    const url = new URL(window.location.href);

    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === undefined) url.searchParams.delete(key);
      else url.searchParams.set(key, value);
    });

    this.navigate(url.pathname + url.search, { replace: true });
  }
}

export const appRouter = ApplicationRouter.getInstance();

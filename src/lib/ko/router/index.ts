import type { RouterData } from '@/types/router';
import { ko } from '../globals';

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
  routes?: RouteConfig[];
  notFoundComponent?: string;
}

export type RouteParams = Record<string, string>;

export class BaseRouter {
  protected routes: RouteConfig[];
  protected notFoundComponent: string;

  public currentComponent: KnockoutObservable<string>;
  public currentParams: KnockoutObservable<RouteParams>;
  public currentPathname: KnockoutObservable<string>;
  public currentSearch: KnockoutObservable<string>;

  public constructor(options?: RouterOptions) {
    this.start = this.start.bind(this);
    this.dispose = this.dispose.bind(this);
    this.handlePopState = this.handlePopState.bind(this);
    this.navigate = this.navigate.bind(this);
    this.handlePath = this.handlePath.bind(this);
    this.setSearchParams = this.setSearchParams.bind(this);
    this.mapRouterData = this.mapRouterData.bind(this);
    this.runMiddlewares = this.runMiddlewares.bind(this);
    this.matchRoute = this.matchRoute.bind(this);
    this.normalizePath = this.normalizePath.bind(this);

    this.routes = options?.routes ?? this.getDefaultRoutes();
    this.notFoundComponent =
      options?.notFoundComponent ?? this.getDefaultNotFoundComponent();

    this.currentComponent = ko.observable<string>(
      this.routes.find((route) => route.pattern === '/')?.component ??
        this.notFoundComponent,
    );
    this.currentParams = ko.observable<RouteParams>({});
    this.currentPathname = ko.observable(window.location.pathname);
    this.currentSearch = ko.observable(window.location.search);
  }

  protected getDefaultRoutes(): RouteConfig[] {
    return [];
  }

  protected getDefaultNotFoundComponent(): string {
    return 'not-found-component';
  }

  public start(): void {
    window.addEventListener('popstate', this.handlePopState);
    this.handlePath(window.location.pathname + window.location.search);
  }

  public dispose(): void {
    window.removeEventListener('popstate', this.handlePopState);
  }

  public navigate(
    path: string,
    options?: { replace?: boolean | undefined },
  ): void {
    if (window.location.pathname + window.location.search === path) {
      return;
    }

    if (options?.replace) {
      window.history.replaceState({}, '', path);
    } else {
      window.history.pushState({}, '', path);
    }

    this.handlePath(path);
  }

  public setSearchParams(
    newParams: Record<string, string | null | undefined>,
  ): void {
    const url = new URL(window.location.href);

    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, value);
      }
    });

    this.navigate(url.pathname + url.search, { replace: true });
  }

  public mapRouterData(): RouterData {
    return {
      navigate: (path: string, options?: { replace?: boolean | undefined }) =>
        this.navigate(path, options),
      params: this.currentParams(),
      location: {
        pathname: this.currentPathname(),
        search: this.currentSearch(),
      },
      setSearchParams: (newParams: Record<string, string>) => {
        this.setSearchParams(newParams);
      },
    };
  }

  protected handlePopState = (): void => {
    this.handlePath(window.location.pathname + window.location.search);
  };

  protected handlePath(fullPath: string): void {
    const [rawPath, queryString] = fullPath.split('?');
    const pathname = rawPath ? this.normalizePath(rawPath) : '';
    const queryParams = queryString
      ? Object.fromEntries(new URLSearchParams(queryString))
      : {};

    this.currentPathname(pathname);
    this.currentSearch(queryString ? `?${queryString}` : '');

    for (const route of this.routes) {
      const match = this.matchRoute(route.pattern, pathname);

      if (!match) {
        continue;
      }

      const middlewareResult = this.runMiddlewares(route, fullPath);

      if (middlewareResult === false) {
        return;
      }

      if (typeof middlewareResult === 'string') {
        this.navigate(middlewareResult, { replace: true });
        return;
      }

      this.currentComponent(route.component);
      this.currentParams({ ...queryParams, ...match.params });
      return;
    }

    this.currentComponent(this.notFoundComponent);
    this.currentParams({ ...queryParams });
  }

  protected normalizePath(path: string): string {
    if (!path) {
      return '';
    }

    return path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
  }

  protected runMiddlewares(
    route: RouteConfig,
    fullPath: string,
  ): boolean | string | void {
    for (const middleware of route.middlewares ?? []) {
      const result = middleware({
        navigate: this.navigate,
        fullPath,
      });

      if (result === false || typeof result === 'string') {
        return result;
      }
    }
  }

  protected matchRoute(
    pattern: string,
    pathname: string,
  ): { params: RouteParams } | null {
    const paramNames: string[] = [];

    const regexPattern = pattern
      .replace(/:([^\\/]+)/g, (_, paramName: string) => {
        paramNames.push(paramName);
        return '([a-zA-Z0-9_-]+)';
      })
      .replace(/\//g, '\\/');

    const regex = new RegExp(`^${regexPattern}$`);
    const match = pathname.match(regex);

    if (!match) {
      return null;
    }

    const paramValues = match.slice(1);

    const params = paramNames.reduce<RouteParams>((acc, name, index) => {
      acc[name] = paramValues[index] || '';
      return acc;
    }, {});

    return { params };
  }
}

import type { RouterSnapshot } from '@/types/router';
import { ko } from '../globals';

export interface RouteMiddlewareContext {
  navigate: (path: string, options?: { replace?: boolean | undefined }) => void;
  fullPath: string;
}

export type RouteMiddleware = (
  context: RouteMiddlewareContext,
) => boolean | string | void;

export interface RouteConfig {
  pattern: string;
  component: string;
  middlewares?: RouteMiddleware[] | undefined;
}

export interface RouterOptions {
  routes?: RouteConfig[];
  notFoundComponent?: string;
  middlewares?: RouteMiddleware[] | undefined;
}

export type RouteParams = Record<string, string>;
export type SearchParamsPatch = Record<
  string,
  string | number | boolean | null | undefined
>;

export class BaseRouter {
  protected routes: RouteConfig[];
  protected notFoundComponent: string;
  protected globalMiddlewares: RouteMiddleware[];
  protected isStarted: boolean = false;

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
    this.getSnapshot = this.getSnapshot.bind(this);
    this.runMiddlewares = this.runMiddlewares.bind(this);
    this.matchRoute = this.matchRoute.bind(this);
    this.matchSegments = this.matchSegments.bind(this);
    this.rankRoutes = this.rankRoutes.bind(this);
    this.getRouteScore = this.getRouteScore.bind(this);
    this.isWildcardSegment = this.isWildcardSegment.bind(this);
    this.getWildcardParamName = this.getWildcardParamName.bind(this);
    this.normalizePath = this.normalizePath.bind(this);
    this.parseFullPath = this.parseFullPath.bind(this);
    this.applyState = this.applyState.bind(this);

    this.routes = this.rankRoutes(options?.routes ?? this.getDefaultRoutes());
    this.globalMiddlewares = options?.middlewares || [];
    this.notFoundComponent =
      options?.notFoundComponent ?? this.getDefaultNotFoundComponent();

    this.currentComponent = ko.observable<string>(
      this.routes.find((route) => route.pattern === '/')?.component ??
        this.notFoundComponent,
    );
    this.currentParams = ko.observable<RouteParams>({});
    this.currentPathname = ko.observable<string>(
      this.normalizePath(window.location.pathname),
    );
    this.currentSearch = ko.observable<string>(window.location.search);
  }

  protected getDefaultRoutes(): RouteConfig[] {
    return [];
  }

  protected getDefaultNotFoundComponent(): string {
    return 'not-found-component';
  }

  public start(): void {
    if (this.isStarted) {
      return;
    }

    this.isStarted = true;
    window.addEventListener('popstate', this.handlePopState);
    this.handlePath(window.location.pathname + window.location.search);
  }

  public dispose(): void {
    if (!this.isStarted) {
      return;
    }

    this.isStarted = false;
    window.removeEventListener('popstate', this.handlePopState);
  }

  public navigate(
    path: string,
    options?: { replace?: boolean | undefined },
  ): void {
    if (!path.startsWith('/')) {
      throw new Error(`BaseRouter.navigate: invalid path "${path}"`);
    }

    const nextUrl = new URL(path, window.location.origin);
    const nextFullPath = nextUrl.pathname + nextUrl.search;
    const currentFullPath = window.location.pathname + window.location.search;

    if (currentFullPath === nextFullPath) {
      return;
    }

    if (options?.replace) {
      window.history.replaceState({}, '', nextFullPath);
    } else {
      window.history.pushState({}, '', nextFullPath);
    }

    this.handlePath(nextFullPath);
  }

  public setSearchParams(newParams: SearchParamsPatch): void {
    const url = new URL(window.location.href);

    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, String(value));
      }
    });

    this.navigate(url.pathname + url.search, { replace: true });
  }

  public getSnapshot(): RouterSnapshot {
    return {
      navigate: this.navigate,
      params: this.currentParams(),
      location: {
        pathname: this.currentPathname(),
        search: this.currentSearch(),
      },
      setSearchParams: this.setSearchParams,
    };
  }

  protected handlePopState = (): void => {
    this.handlePath(window.location.pathname + window.location.search);
  };

  protected handlePath(fullPath: string): void {
    const { pathname, search, queryParams } = this.parseFullPath(fullPath);

    const globalMiddlewareResult = this.runMiddlewares(
      this.globalMiddlewares,
      fullPath,
    );

    if (globalMiddlewareResult === false) {
      return;
    }

    if (typeof globalMiddlewareResult === 'string') {
      this.navigate(globalMiddlewareResult, { replace: true });
      return;
    }

    for (const route of this.routes) {
      const match = this.matchRoute(route.pattern, pathname);

      if (!match) {
        continue;
      }

      const middlewareResult = this.runMiddlewares(
        route.middlewares || [],
        fullPath,
      );

      if (middlewareResult === false) {
        return;
      }

      if (typeof middlewareResult === 'string') {
        this.navigate(middlewareResult, { replace: true });
        return;
      }

      this.applyState({
        pathname,
        search,
        component: route.component,
        params: { ...queryParams, ...match },
      });
      return;
    }

    this.applyState({
      pathname,
      search,
      component: this.notFoundComponent,
      params: { ...queryParams },
    });
  }

  protected parseFullPath(fullPath: string): {
    pathname: string;
    search: string;
    queryParams: RouteParams;
  } {
    const url = new URL(fullPath, window.location.origin);

    return {
      pathname: this.normalizePath(url.pathname),
      search: url.search,
      queryParams: Object.fromEntries(url.searchParams.entries()),
    };
  }

  protected normalizePath(path: string): string {
    if (!path || path === '/') {
      return '/';
    }

    return path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
  }

  protected applyState(nextState: {
    pathname: string;
    search: string;
    component: string;
    params: RouteParams;
  }): void {
    this.currentPathname(nextState.pathname);
    this.currentSearch(nextState.search);
    this.currentComponent(nextState.component);
    this.currentParams(nextState.params);
  }

  protected runMiddlewares(
    middlewares: RouteMiddleware[],
    fullPath: string,
  ): boolean | string | void {
    for (const middleware of middlewares) {
      const result = middleware({
        navigate: this.navigate,
        fullPath,
      });

      if (result === false || typeof result === 'string') {
        return result;
      }
    }
  }

  /* protected matchRoute(pattern: string, pathname: string): RouteParams | null {
    const normalizedPattern = this.normalizePath(pattern);

    const patternSegments = normalizedPattern.split('/').filter(Boolean);
    const pathSegments = pathname.split('/').filter(Boolean);

    if (patternSegments.length !== pathSegments.length) {
      return null;
    }

    const params: RouteParams = {};

    for (let index = 0; index < patternSegments.length; index += 1) {
      const patternSegment = patternSegments[index];
      const pathSegment = pathSegments[index];

      if (!patternSegment || !pathSegment) {
        return null;
      }

      if (patternSegment.startsWith(':')) {
        params[patternSegment.slice(1)] = pathSegment;
        continue;
      }

      if (patternSegment !== pathSegment) {
        return null;
      }
    }

    return params;
  } */

  protected rankRoutes(routes: RouteConfig[]): RouteConfig[] {
    return routes
      .map((route, index) => ({
        route,
        index,
        score: this.getRouteScore(route.pattern),
      }))
      .sort((left, right) => {
        return right.score - left.score || left.index - right.index;
      })
      .map((item) => item.route);
  }

  protected getRouteScore(pattern: string): number {
    const segments = this.normalizePath(pattern).split('/').filter(Boolean);

    if (segments.length === 0) {
      return 10_000;
    }

    return (
      segments.reduce((score, segment) => {
        if (this.isWildcardSegment(segment)) {
          return score + 1;
        }

        if (segment.startsWith(':')) {
          return score + (segment.endsWith('?') ? 200 : 300);
        }

        return score + 400;
      }, 0) + segments.length
    );
  }

  protected isWildcardSegment(segment: string): boolean {
    return segment === '*' || segment.startsWith('*');
  }

  protected getWildcardParamName(segment: string): string {
    return segment.length > 1 ? segment.slice(1) : 'wildcard';
  }

  protected matchRoute(pattern: string, pathname: string): RouteParams | null {
    const normalizedPattern = this.normalizePath(pattern);
    const patternSegments = normalizedPattern.split('/').filter(Boolean);
    const pathSegments = pathname.split('/').filter(Boolean);

    return this.matchSegments(patternSegments, pathSegments, 0, 0, {});
  }

  protected matchSegments(
    patternSegments: string[],
    pathSegments: string[],
    patternIndex: number,
    pathIndex: number,
    params: RouteParams,
  ): RouteParams | null {
    if (patternIndex === patternSegments.length) {
      return pathIndex === pathSegments.length ? params : null;
    }

    const patternSegment = patternSegments[patternIndex];

    if (!patternSegment) {
      return null;
    }

    if (this.isWildcardSegment(patternSegment)) {
      if (patternIndex !== patternSegments.length - 1) {
        return null;
      }

      return {
        ...params,
        [this.getWildcardParamName(patternSegment)]: pathSegments
          .slice(pathIndex)
          .join('/'),
      };
    }

    const pathSegment = pathSegments[pathIndex];

    if (patternSegment.startsWith(':')) {
      const isOptional = patternSegment.endsWith('?');
      const paramName = patternSegment.slice(1, isOptional ? -1 : undefined);

      if (!paramName) {
        return null;
      }

      if (isOptional) {
        const skipped = this.matchSegments(
          patternSegments,
          pathSegments,
          patternIndex + 1,
          pathIndex,
          params,
        );

        if (skipped) {
          return skipped;
        }
      }

      if (pathSegment === undefined) {
        return null;
      }

      return this.matchSegments(
        patternSegments,
        pathSegments,
        patternIndex + 1,
        pathIndex + 1,
        {
          ...params,
          [paramName]: pathSegment,
        },
      );
    }

    if (pathSegment === undefined || patternSegment !== pathSegment) {
      return null;
    }

    return this.matchSegments(
      patternSegments,
      pathSegments,
      patternIndex + 1,
      pathIndex + 1,
      params,
    );
  }
}

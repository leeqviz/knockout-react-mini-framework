import { ko } from '@/shared/lib/ko';
import type {
  NavigateOptions,
  ResolvedRouteState,
  ResolveResult,
  RouteConfig,
  RouteMiddleware,
  RouteParams,
  RouterOptions,
  RouterSnapshot,
  SearchParamsPatch,
} from './types';

export class BaseRouter {
  protected routes: RouteConfig[];
  protected globalMiddlewares: RouteMiddleware[];
  protected isStarted: boolean = false;

  public currentComponent: KnockoutObservable<string>;
  public currentParams: KnockoutObservable<RouteParams>;
  public currentPathname: KnockoutObservable<string>;
  public currentSearch: KnockoutObservable<string>;
  public currentSearchParams: KnockoutObservable<RouteParams>;
  public currentHistoryState: KnockoutObservable<unknown>;

  protected constructor(options: RouterOptions) {
    this.start = this.start.bind(this);
    this.dispose = this.dispose.bind(this);
    this.handlePopState = this.handlePopState.bind(this);
    this.navigate = this.navigate.bind(this);
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
    this.resolvePath = this.resolvePath.bind(this);
    this.resolveTo = this.resolveTo.bind(this);

    this.routes = this.rankRoutes(options?.routes ?? []);
    this.globalMiddlewares = options?.middlewares || [];

    const initialUrl = new URL(window.location.href);

    this.currentComponent = ko.observable<string>(
      this.routes.find((route) => route.pattern === '/')?.component ?? '',
    );
    this.currentParams = ko.observable<RouteParams>({});
    this.currentPathname = ko.observable<string>(
      this.normalizePath(initialUrl.pathname),
    );
    this.currentSearch = ko.observable<string>(initialUrl.search);
    this.currentSearchParams = ko.observable(
      Object.fromEntries(initialUrl.searchParams.entries()),
    );
    this.currentHistoryState = ko.observable(window.history.state ?? null);
  }

  public start(): void {
    if (this.isStarted) {
      return;
    }

    this.isStarted = true;
    window.addEventListener('popstate', this.handlePopState);
    const fullPath = window.location.pathname + window.location.search;
    const result = this.resolvePath(fullPath, window.history.state ?? null);

    if (result.type === 'redirect') {
      this.navigate(result.to, {
        replace: true,
        state: null,
      });
      return;
    }

    if (result.type === 'resolved') {
      this.applyState(result.value);
    }
  }

  public dispose(): void {
    if (!this.isStarted) {
      return;
    }

    this.isStarted = false;
    window.removeEventListener('popstate', this.handlePopState);
  }

  public navigate(path: string, options?: NavigateOptions | undefined): void {
    const nextUrl = this.resolveTo(path);

    if (nextUrl.origin !== window.location.origin) {
      throw new Error(
        `BaseRouter.navigate: cross-origin path "${path}" is not allowed`,
      );
    }

    const nextFullPath = nextUrl.pathname + nextUrl.search;
    const currentFullPath = window.location.pathname + window.location.search;
    const nextState = options?.state ?? null;

    const samePath = currentFullPath === nextFullPath;
    const sameState = window.history.state === nextState;

    if (samePath && sameState) {
      return;
    }

    const result = this.resolvePath(nextFullPath, nextState);

    if (result.type === 'blocked') {
      return;
    }

    if (result.type === 'redirect') {
      if (result.to === nextFullPath) {
        return;
      }

      this.navigate(result.to, { replace: true, state: nextState });
      return;
    }

    if (options?.replace) {
      window.history.replaceState(nextState, '', nextFullPath);
    } else {
      window.history.pushState(nextState, '', nextFullPath);
    }

    this.applyState(result.value);
  }

  public setSearchParams(
    newParams: SearchParamsPatch,
    options?: NavigateOptions,
  ): void {
    const url = new URL(window.location.href);

    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, String(value));
      }
    });

    this.navigate(url.pathname + url.search, {
      replace: options?.replace ?? true,
      state: options?.state ?? this.currentHistoryState(),
    });
  }

  public getSnapshot(): RouterSnapshot {
    return {
      navigate: this.navigate,
      params: this.currentParams(),
      searchParams: this.currentSearchParams(),
      location: {
        pathname: this.currentPathname(),
        search: this.currentSearch(),
        state: this.currentHistoryState(),
      },
      setSearchParams: this.setSearchParams,
    };
  }

  protected handlePopState = (): void => {
    const previousFullPath = this.currentPathname() + this.currentSearch();
    const previousState = this.currentHistoryState();
    const nextFullPath = window.location.pathname + window.location.search;
    const nextState = window.history.state ?? null;

    const result = this.resolvePath(nextFullPath, nextState);

    if (result.type === 'blocked') {
      window.history.replaceState(previousState ?? null, '', previousFullPath);
      return;
    }

    if (result.type === 'redirect') {
      if (result.to === nextFullPath) {
        window.history.replaceState(
          previousState ?? null,
          '',
          previousFullPath,
        );
        return;
      }

      this.navigate(result.to, {
        replace: true,
        state: null,
      });
      return;
    }

    this.applyState(result.value);
  };

  protected resolvePath(fullPath: string, state: unknown): ResolveResult {
    const { pathname, search, searchParams } = this.parseFullPath(fullPath);

    const globalMiddlewareResult = this.runMiddlewares(this.globalMiddlewares, {
      fullPath,
      pathname,
      search,
      state,
    });

    if (globalMiddlewareResult === false) {
      return { type: 'blocked' };
    }

    if (typeof globalMiddlewareResult === 'string') {
      return { type: 'redirect', to: globalMiddlewareResult };
    }

    for (const route of this.routes) {
      const match = this.matchRoute(route.pattern, pathname);

      if (!match) {
        continue;
      }

      const middlewareResult = this.runMiddlewares(route.middlewares ?? [], {
        fullPath,
        pathname,
        search,
        state,
      });

      if (middlewareResult === false) {
        return { type: 'blocked' };
      }

      if (typeof middlewareResult === 'string') {
        return { type: 'redirect', to: middlewareResult };
      }

      return {
        type: 'resolved',
        value: {
          pathname,
          search,
          component: route.component,
          params: match,
          searchParams,
          state,
        },
      };
    }

    return {
      type: 'resolved',
      value: {
        pathname,
        search,
        component: '',
        params: {},
        searchParams,
        state,
      },
    };
  }

  protected resolveTo(path: string): URL {
    if (!path) {
      throw new Error('BaseRouter.navigate: empty path');
    }

    const origin = window.location.origin;
    const currentPathname = this.currentPathname();
    const currentSearch = this.currentSearch();

    if (path.startsWith('/')) {
      return new URL(path, origin);
    }

    if (path.startsWith('?')) {
      return new URL(`${currentPathname}${path}`, origin);
    }

    if (path.startsWith('#')) {
      return new URL(`${currentPathname}${currentSearch}${path}`, origin);
    }

    const basePath = currentPathname.endsWith('/')
      ? currentPathname
      : `${currentPathname}/`;

    return new URL(path, `${origin}${basePath}`);
  }

  protected parseFullPath(fullPath: string): {
    pathname: string;
    search: string;
    searchParams: RouteParams;
  } {
    const url = new URL(fullPath, window.location.origin);

    return {
      pathname: this.normalizePath(url.pathname),
      search: url.search,
      searchParams: Object.fromEntries(url.searchParams.entries()),
    };
  }

  protected normalizePath(path: string): string {
    if (!path || path === '/') {
      return '/';
    }

    return path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
  }

  protected applyState(nextState: ResolvedRouteState): void {
    this.currentPathname(nextState.pathname);
    this.currentSearch(nextState.search);
    this.currentComponent(nextState.component);
    this.currentParams(nextState.params);
    this.currentSearchParams(nextState.searchParams);
    this.currentHistoryState(nextState.state);
  }

  protected runMiddlewares(
    middlewares: RouteMiddleware[],
    context: {
      fullPath: string;
      pathname: string;
      search: string;
      state: unknown;
    },
  ): boolean | string | void {
    for (const middleware of middlewares) {
      const result = middleware({
        navigate: this.navigate,
        fullPath: context.fullPath,
        pathname: context.pathname,
        search: context.search,
        state: context.state,
      });

      if (result === false || typeof result === 'string') {
        return result;
      }
    }
  }

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

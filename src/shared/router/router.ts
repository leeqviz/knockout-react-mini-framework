import { ko } from '@/shared/lib/ko';
import { ResolveResultType } from './route';
import type {
  BlockedResult,
  ErrorResult,
  NavigateOptions,
  RedirectResult,
  ResolvedResult,
  ResolvedRouteState,
  ResolveResult,
  RewriteResult,
  RouteConfig,
  RouteMiddleware,
  RouteMiddlewareContext,
  RouteMiddlewareResult,
  RouteParams,
  RouterOptions,
  RouterSnapshot,
  SearchParamsPatch,
} from './types';

export class BaseRouter {
  protected routes: RouteConfig[];
  protected middlewares: RouteMiddleware[];
  protected isStarted: boolean = false;

  public currentComponent: KnockoutObservable<string>;
  public currentParams: KnockoutObservable<RouteParams>;
  public currentPathname: KnockoutObservable<string>;
  public currentSearch: KnockoutObservable<string>;
  public currentSearchParams: KnockoutObservable<RouteParams>;
  public currentHistoryState: KnockoutObservable<unknown>;
  public currentHash: KnockoutObservable<string>;

  protected constructor(options?: RouterOptions) {
    this.routes = this.rankRoutes(options?.routes ?? []);
    this.middlewares = options?.middlewares || [];

    const initialUrl = new URL(window.location.href);
    const initialMatch = this.routes.find((r) =>
      this.matchRoute(r.pattern, initialUrl.pathname),
    );

    this.currentComponent = ko.observable(initialMatch?.component ?? '');
    this.currentParams = ko.observable({});
    this.currentPathname = ko.observable(
      this.normalizePath(initialUrl.pathname),
    );
    this.currentSearch = ko.observable(initialUrl.search);
    this.currentSearchParams = ko.observable(
      Object.fromEntries(initialUrl.searchParams.entries()),
    );
    this.currentHistoryState = ko.observable(window.history.state ?? null);
    this.currentHash = ko.observable(initialUrl.hash);
  }

  public start = (): void => {
    if (this.isStarted) return;
    this.isStarted = true;
    window.addEventListener('popstate', this.handlePopState);

    const fullPath = this.getCurrentFullPath();
    const initialHash = window.location.hash;
    const state = window.history.state ?? null;
    const originalUrl = this.parseUrl(
      new URL(fullPath, window.location.origin),
    );
    const result = this.resolvePath(fullPath, state);

    this.handleResolveResult(result, {
      onBlocked: () => {},
      onRedirect: (res) => {
        this.navigate(res.to, {
          replace: res.replace ?? false,
          state: null,
        });
      },
      onRewrite: (res) => {
        this.resolveRewrite(originalUrl, res.to, state);
      },
      onError: (res) => {
        throw res.error;
      },
      onResolved: (res) => {
        this.applyState({ ...res.value, hash: initialHash });
        this.scheduleScrollToFragment(initialHash);
      },
    });
  };

  public dispose = (): void => {
    if (!this.isStarted) return;

    this.isStarted = false;
    window.removeEventListener('popstate', this.handlePopState);
  };

  public navigate = (
    path: string,
    options?: NavigateOptions | undefined,
  ): void => {
    const nextUrl = this.resolveTo(path);

    if (nextUrl.origin !== window.location.origin) {
      throw new Error(
        `BaseRouter.navigate: cross-origin path "${path}" is not allowed`,
      );
    }

    const nextFullPath = this.normalizePath(nextUrl.pathname) + nextUrl.search;
    const nextHash = nextUrl.hash;
    const currentFullPath = this.getCurrentFullPath();
    const nextState = options?.state ?? null;

    const samePath = currentFullPath === nextFullPath;
    const sameState = window.history.state === nextState;
    const sameHash = this.currentHash() === nextHash;

    if (samePath && sameState && sameHash) return;

    if (samePath && sameState && !sameHash) {
      const fullUrlWithHash = currentFullPath + nextHash;

      if (options?.replace)
        window.history.replaceState(nextState, '', fullUrlWithHash);
      else window.history.pushState(nextState, '', fullUrlWithHash);

      this.currentHash(nextHash);
      this.scheduleScrollToFragment(nextHash);
      return;
    }

    const result = this.resolvePath(nextFullPath, nextState);
    const originalUrl = this.parseUrl(
      new URL(nextFullPath, window.location.origin),
    );

    this.handleResolveResult(result, {
      onBlocked: () => {},
      onRedirect: (res) => {
        if (this.normalizeFullPath(res.to) === nextFullPath) return;

        this.navigate(res.to, {
          replace: res.replace ?? false,
          state: nextState,
        });
      },
      onRewrite: (res) => {
        this.resolveRewrite(originalUrl, res.to, nextState);
      },
      onError: (res) => {
        throw res.error;
      },
      onResolved: (res) => {
        const normalizedPath = res.value.pathname + res.value.search + nextHash;
        if (options?.replace)
          window.history.replaceState(nextState, '', normalizedPath);
        else window.history.pushState(nextState, '', normalizedPath);

        this.applyState({ ...res.value, hash: nextHash });
        this.scheduleScrollToFragment(nextHash);
      },
    });
  };

  protected normalizeFullPath = (fullPath: string): string => {
    const url = new URL(fullPath, window.location.origin);
    return this.normalizePath(url.pathname) + url.search;
  };

  public setSearchParams = (
    newParams: SearchParamsPatch,
    options?: NavigateOptions,
  ): void => {
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
  };

  public getSnapshot = (): RouterSnapshot => {
    return {
      navigate: this.navigate,
      params: this.currentParams(),
      searchParams: this.currentSearchParams(),
      location: {
        pathname: this.currentPathname(),
        hash: this.currentHash(),
        search: this.currentSearch(),
        state: this.currentHistoryState(),
      },
      setSearchParams: this.setSearchParams,
    };
  };

  protected handlePopState = (): void => {
    const previousFullPath = this.currentPathname() + this.currentSearch();
    const previousHash = this.currentHash();
    const previousState = this.currentHistoryState();

    const nextFullPath = this.getCurrentFullPath();
    const nextHash = window.location.hash;
    const nextState = window.history.state ?? null;

    const samePath = previousFullPath === nextFullPath;

    // Fragment-only popstate
    if (samePath) {
      this.currentHash(nextHash);
      this.currentHistoryState(nextState);
      this.scheduleScrollToFragment(nextHash);
      return;
    }

    const originalUrl = this.parseUrl(
      new URL(nextFullPath + nextHash, window.location.origin),
    );
    const result = this.resolvePath(nextFullPath, nextState);

    this.handleResolveResult(result, {
      onBlocked: () => {
        window.history.replaceState(
          previousState ?? null,
          '',
          previousFullPath + previousHash,
        );
      },
      onRedirect: (res) => {
        if (this.normalizeFullPath(res.to) === nextFullPath) {
          window.history.replaceState(
            previousState ?? null,
            '',
            previousFullPath + previousHash,
          );
          return;
        }

        this.navigate(res.to, {
          replace: res.replace ?? false,
          state: null,
        });
      },
      onRewrite: (res) => {
        this.resolveRewrite(originalUrl, res.to, nextState);
      },
      onError: (res) => {
        throw res.error;
      },
      onResolved: (res) => {
        this.applyState({ ...res.value, hash: nextHash });
        this.scheduleScrollToFragment(nextHash);
      },
    });
  };

  protected resolveRewrite = (
    originalUrl: {
      pathname: string;
      search: string;
      hash: string;
      searchParams: RouteParams;
    },
    rewriteTo: string,
    state: unknown,
    depth: number = 0,
  ): void => {
    if (depth > 10) {
      throw new Error(
        `BaseRouter: maximum rewrite depth exceeded at "${rewriteTo}"`,
      );
    }

    const result = this.resolvePath(rewriteTo, state);

    this.handleResolveResult(result, {
      onBlocked: () => {},
      onRedirect: (res) => {
        this.navigate(res.to, { replace: res.replace ?? false, state });
      },
      onRewrite: (res) => {
        this.resolveRewrite(originalUrl, res.to, state, depth + 1);
      },
      onError: (res) => {
        throw res.error;
      },
      onResolved: (res) => {
        this.applyState({
          pathname: originalUrl.pathname,
          search: originalUrl.search,
          searchParams: originalUrl.searchParams,
          component: res.value.component,
          params: res.value.params,
          hash: originalUrl.hash,
          state,
        });
        this.scheduleScrollToFragment(originalUrl.hash);
      },
    });
  };

  protected resolvePath = (fullPath: string, state: unknown): ResolveResult => {
    const url = new URL(fullPath, window.location.origin);
    const { pathname, search, searchParams, hash } = this.parseUrl(url);

    const globalMiddlewareResult = this.runMiddlewares(this.middlewares, {
      pathname,
      search,
      state,
    });

    if (globalMiddlewareResult) return globalMiddlewareResult;

    for (const route of this.routes) {
      const match = this.matchRoute(route.pattern, pathname);

      if (!match) continue;

      const middlewareResult = this.runMiddlewares(route.middlewares ?? [], {
        pathname,
        search,
        state,
      });

      if (middlewareResult) return middlewareResult;

      return {
        type: ResolveResultType.Resolved,
        value: {
          pathname,
          search,
          hash,
          component: route.component,
          params: match,
          searchParams,
          state,
        },
      };
    }

    return {
      type: ResolveResultType.Resolved,
      value: {
        pathname,
        search,
        hash,
        component: '',
        params: {},
        searchParams,
        state,
      },
    };
  };

  protected resolveTo = (path: string): URL => {
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
  };

  protected parseUrl = (
    url: URL,
  ): {
    pathname: string;
    search: string;
    searchParams: RouteParams;
    hash: string;
  } => {
    return {
      pathname: this.normalizePath(url.pathname),
      search: url.search,
      searchParams: Object.fromEntries(url.searchParams.entries()),
      hash: url.hash,
    };
  };

  protected normalizePath = (path: string): string => {
    if (!path || path === '/') {
      return '/';
    }

    return path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
  };

  protected applyState = (nextState: ResolvedRouteState): void => {
    this.currentPathname(nextState.pathname);
    this.currentSearch(nextState.search);
    this.currentHash(nextState.hash);
    this.currentComponent(nextState.component);
    this.currentParams(nextState.params);
    this.currentSearchParams(nextState.searchParams);
    this.currentHistoryState(nextState.state);
  };

  protected scheduleScrollToFragment = (hash: string): void => {
    if (!hash) return;
    requestAnimationFrame(() => this.scrollToFragment(hash));
  };

  protected scrollToFragment = (hash: string): void => {
    const id = hash.startsWith('#') ? hash.slice(1) : hash;
    if (!id) return;

    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const el =
      document.getElementById(id) ??
      document.querySelector<HTMLElement>(`[name="${id}"]`);

    el?.scrollIntoView({ behavior: 'smooth' });
  };

  protected runMiddlewares = (
    middlewares: RouteMiddleware[],
    context: RouteMiddlewareContext,
  ): RouteMiddlewareResult => {
    for (const middleware of middlewares) {
      const result = middleware(context);
      if (result) return result;
    }
  };

  protected handleResolveResult = (
    result: ResolveResult,
    options: {
      onBlocked: (result: BlockedResult) => void;
      onError: (result: ErrorResult) => void;
      onRedirect: (result: RedirectResult) => void;
      onRewrite: (result: RewriteResult) => void;
      onResolved: (result: ResolvedResult) => void;
    },
  ): void => {
    switch (result.type) {
      case ResolveResultType.Error: {
        options.onError(result);
        return;
      }
      case ResolveResultType.Blocked: {
        options.onBlocked(result);
        return;
      }
      case ResolveResultType.Rewrite: {
        options.onRewrite(result);
        return;
      }
      case ResolveResultType.Redirect: {
        options.onRedirect(result);
        return;
      }
      case ResolveResultType.Resolved: {
        options.onResolved(result);
        return;
      }
      default: {
        return;
      }
    }
  };

  private getCurrentFullPath = (): string => {
    return (
      this.normalizePath(window.location.pathname) + window.location.search
    );
  };

  protected rankRoutes = (routes: RouteConfig[]): RouteConfig[] => {
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
  };

  protected getRouteScore = (pattern: string): number => {
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
  };

  protected isWildcardSegment = (segment: string): boolean => {
    return segment === '*' || segment.startsWith('*');
  };

  protected getWildcardParamName = (segment: string): string => {
    return segment.length > 1 ? segment.slice(1) : 'wildcard';
  };

  protected matchRoute = (
    pattern: string,
    pathname: string,
  ): RouteParams | null => {
    const normalizedPattern = this.normalizePath(pattern);
    const patternSegments = normalizedPattern.split('/').filter(Boolean);
    const pathSegments = pathname.split('/').filter(Boolean);

    return this.matchSegments(patternSegments, pathSegments, 0, 0, {});
  };

  protected matchSegments = (
    patternSegments: string[],
    pathSegments: string[],
    patternIndex: number,
    pathIndex: number,
    params: RouteParams,
  ): RouteParams | null => {
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
  };
}

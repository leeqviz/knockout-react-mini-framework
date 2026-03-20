import { ko } from '@/shared/lib/ko';
import { ResolveResultType } from './route';
import type {
  AfterNavigateHook,
  BlockedResult,
  BuildPathSearch,
  ErrorResult,
  InternalHistoryState,
  NavigateExternalOptions,
  NavigateOptions,
  NavigationBlockedHook,
  NavigationErrorHook,
  NavigationLocation,
  QueryParamConfig,
  RedirectResult,
  ResolvedResult,
  ResolvedRouteInfo,
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
  ScrollBehaviorFn,
  ScrollPosition,
  ScrollTarget,
  SearchParams,
  SearchParamsPatch,
  StateCompareStrategy,
} from './types';

export class BaseRouter<
  TMeta extends Record<string, unknown> = Record<string, unknown>,
> {
  public readonly routes: RouteConfig<TMeta>[];
  protected middlewares: RouteMiddleware<TMeta>[];
  protected scrollPositions = new Map<string, ScrollPosition>();
  protected currentHistoryKey: string = '';
  protected previousRouteState: ResolvedRouteState<TMeta> | null = null;
  protected readonly scrollBehavior: ScrollBehaviorFn<TMeta>;
  protected readonly stateCompare: (a: unknown, b: unknown) => boolean;
  protected readonly afterNavigateHook: AfterNavigateHook<TMeta> | undefined;
  protected readonly onNavigationBlockedHook:
    | NavigationBlockedHook<TMeta>
    | undefined;
  protected readonly onNavigationErrorHook: NavigationErrorHook | undefined;
  protected readonly confirmLeaveHook:
    | ((
        to: NavigationLocation,
        from: ResolvedRouteState<TMeta> | null,
      ) => boolean)
    | undefined;
  protected readonly enableBeforeUnload: boolean;
  protected isStarted: boolean = false;

  public currentComponent: KnockoutObservable<string>;
  public currentParams: KnockoutObservable<RouteParams>;
  public currentPathname: KnockoutObservable<string>;
  public currentSearch: KnockoutObservable<string>;
  public currentSearchParams: KnockoutObservable<SearchParams>;
  public currentHistoryState: KnockoutObservable<unknown>;
  public currentHash: KnockoutObservable<string>;
  public currentRouteName: KnockoutObservable<string | undefined>;
  public currentMeta: KnockoutObservable<TMeta | undefined>;

  protected static readonly defaultScrollBehavior: ScrollBehaviorFn = (
    _to,
    _from,
    savedPosition,
  ) => {
    if (savedPosition) return savedPosition;
    return 'top';
    /* Custom 
      if (savedPosition) return savedPosition;           
      if (to.hash) return null;                          
      if (to.meta?.scrollMode === 'preserve') return 'preserve'; 
      return 'top';
    */
  };

  protected static readonly stateComparators = {
    reference: (a: unknown, b: unknown): boolean => a === b,

    shallow: (a: unknown, b: unknown): boolean => {
      if (a === b) return true;
      if (a === null || b === null) return false;
      if (typeof a !== 'object' || typeof b !== 'object') return false;

      const keysA = Object.keys(a as object);
      const keysB = Object.keys(b as object);

      if (keysA.length !== keysB.length) return false;

      return keysA.every(
        (key) =>
          (b as Record<string, unknown>)[key] ===
          (a as Record<string, unknown>)[key],
      );
    },

    deep: (a: unknown, b: unknown): boolean => {
      if (a === b) return true;
      if (a === null || b === null) return a === b;
      if (typeof a !== typeof b) return false;
      if (typeof a !== 'object') return a === b;

      if (Array.isArray(a) !== Array.isArray(b)) return false;

      const keysA = Object.keys(a as object);
      const keysB = Object.keys(b as object);

      if (keysA.length !== keysB.length) return false;

      return keysA.every((key) =>
        BaseRouter.stateComparators.deep(
          (a as Record<string, unknown>)[key],
          (b as Record<string, unknown>)[key],
        ),
      );
    },
  } as const;

  protected static resolveComparator(
    strategy: StateCompareStrategy | undefined,
  ): (a: unknown, b: unknown) => boolean {
    if (!strategy || strategy === 'reference') {
      return BaseRouter.stateComparators.reference;
    }
    if (strategy === 'shallow') return BaseRouter.stateComparators.shallow;
    if (strategy === 'deep') return BaseRouter.stateComparators.deep;
    return strategy;
    /* custom
      if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return a === b;
      return (a as { id?: unknown }).id === (b as { id?: unknown }).id;
    */
  }

  protected constructor(options?: RouterOptions<TMeta>) {
    this.routes = this.rankRoutes(options?.routes ?? []);
    this.middlewares = options?.middlewares || [];
    this.scrollBehavior =
      options?.scrollBehavior ??
      (BaseRouter.defaultScrollBehavior as ScrollBehaviorFn<TMeta>);
    this.stateCompare = BaseRouter.resolveComparator(options?.stateCompare);
    this.afterNavigateHook = options?.afterNavigate;
    this.onNavigationBlockedHook = options?.onNavigationBlocked;
    this.onNavigationErrorHook = options?.onNavigationError;
    this.confirmLeaveHook = options?.confirmLeave;
    this.enableBeforeUnload = options?.confirmLeave
      ? (options?.enableBeforeUnload ?? true)
      : false;

    const initialUrl = new URL(window.location.href);
    const initialMatch = this.routes.find((r) =>
      this.matchRoute(r.pattern, initialUrl.pathname),
    );

    this.currentComponent = ko.observable(initialMatch?.component ?? '');
    this.currentRouteName = ko.observable(initialMatch?.name);
    this.currentMeta = ko.observable(initialMatch?.meta);
    this.currentParams = ko.observable({});
    this.currentPathname = ko.observable(
      this.normalizePath(initialUrl.pathname),
    );
    this.currentSearch = ko.observable(initialUrl.search);
    this.currentSearchParams = ko.observable(
      this.parseUrl(initialUrl).searchParams,
    );
    const { data: initialUserState } = this.readHistoryState(
      window.history.state,
    );
    this.currentHistoryState = ko.observable(initialUserState);
    this.currentHash = ko.observable(initialUrl.hash);
  }

  public start = (): void => {
    if (this.isStarted) return;
    this.isStarted = true;

    window.history.scrollRestoration = 'manual';
    window.addEventListener('popstate', this.handlePopState);
    if (this.enableBeforeUnload) {
      window.addEventListener('beforeunload', this.handleBeforeUnload);
    }

    const fullPath = this.getCurrentFullPath();
    const initialHash = window.location.hash;
    const rawState = window.history.state;
    const { key, data: userState } = this.readHistoryState(rawState);
    this.currentHistoryKey = key;

    if (!rawState || !('__routerKey' in Object(rawState))) {
      window.history.replaceState(
        this.wrapState(userState, key),
        '',
        fullPath + initialHash,
      );
    }

    const originalUrl = this.parseUrl(
      new URL(fullPath + initialHash, window.location.origin),
    );
    const result = this.resolvePath(fullPath, userState);

    this.handleResolveResult(result, {
      onBlocked: () => {
        this.notifyNavigationBlocked({
          pathname: originalUrl.pathname,
          search: originalUrl.search,
          hash: originalUrl.hash,
          state: userState,
        });
      },
      onRedirect: (res) => {
        this.navigate(res.to, {
          replace: res.replace ?? false,
          state: null,
        });
      },
      onRewrite: (res) => {
        this.resolveRewrite(originalUrl, res.to, userState);
      },
      onError: (res) => {
        const handled = this.notifyNavigationError(res.error, {
          pathname: originalUrl.pathname,
          search: originalUrl.search,
          hash: originalUrl.hash,
          state: userState,
        });
        if (!handled) throw res.error;
      },
      onResolved: (res) => {
        const nextState = { ...res.value, hash: initialHash };
        this.applyState(nextState);
        this.notifyAfterNavigate(nextState);
        this.handleScroll(nextState, null);
      },
    });
  };

  public dispose = (): void => {
    if (!this.isStarted) return;
    this.isStarted = false;

    window.history.scrollRestoration = 'auto';
    window.removeEventListener('popstate', this.handlePopState);
    if (this.enableBeforeUnload) {
      window.removeEventListener('beforeunload', this.handleBeforeUnload);
    }
  };

  protected handleBeforeUnload = (event: BeforeUnloadEvent): void => {
    event.preventDefault();
    event.returnValue = '';
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

    const { data: currentUserState } = this.readHistoryState(
      window.history.state,
    );
    const nextState = options?.state ?? null;

    const comparator = options?.stateCompare
      ? BaseRouter.resolveComparator(options.stateCompare)
      : this.stateCompare;

    const samePath = currentFullPath === nextFullPath;
    const sameState = comparator(currentUserState, nextState);
    const sameHash = this.currentHash() === nextHash;

    if (!options?.force && samePath && sameState && sameHash) return;

    if (this.confirmLeaveHook && !samePath) {
      const to: NavigationLocation = {
        pathname: this.normalizePath(nextUrl.pathname),
        search: nextUrl.search,
        hash: nextHash,
        state: options?.state ?? null,
      };
      if (!this.confirmLeaveHook(to, this.captureCurrentRouteState())) return;
    }

    if (samePath && sameState && !sameHash) {
      const fullUrlWithHash = currentFullPath + nextHash;

      if (options?.replace) {
        window.history.replaceState(
          this.wrapState(nextState, this.currentHistoryKey),
          '',
          fullUrlWithHash,
        );
      } else {
        this.saveCurrentScrollPosition();
        const newKey = this.generateHistoryKey();
        this.currentHistoryKey = newKey;
        window.history.pushState(
          this.wrapState(nextState, newKey),
          '',
          fullUrlWithHash,
        );
      }

      this.currentHash(nextHash);
      this.currentHistoryState(nextState);
      this.notifyAfterNavigate(this.captureCurrentRouteState());
      this.scheduleScrollToFragment(nextHash);
      return;
    }

    const result = this.resolvePath(nextFullPath, nextState);
    const originalUrl = this.parseUrl(
      new URL(nextFullPath + nextHash, window.location.origin),
    );

    this.handleResolveResult(result, {
      onBlocked: () => {
        this.notifyNavigationBlocked({
          pathname: originalUrl.pathname,
          search: originalUrl.search,
          hash: nextHash,
          state: nextState,
        });
      },
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
        const handled = this.notifyNavigationError(res.error, {
          pathname: originalUrl.pathname,
          search: originalUrl.search,
          hash: nextHash,
          state: nextState,
        });
        if (!handled) throw res.error;
      },
      onResolved: (res) => {
        const normalizedPath = res.value.pathname + res.value.search + nextHash;

        if (options?.replace) {
          window.history.replaceState(
            this.wrapState(nextState, this.currentHistoryKey),
            '',
            normalizedPath,
          );
        } else {
          this.saveCurrentScrollPosition();
          const newKey = this.generateHistoryKey();
          this.currentHistoryKey = newKey;
          window.history.pushState(
            this.wrapState(nextState, newKey),
            '',
            normalizedPath,
          );
        }

        const nextRouteState = { ...res.value, hash: nextHash };
        this.applyState(nextRouteState);
        this.notifyAfterNavigate(nextRouteState);
        this.handleScroll(nextRouteState, null);
      },
    });
  };

  protected normalizeFullPath = (fullPath: string): string => {
    const url = new URL(fullPath, window.location.origin);
    return this.normalizePath(url.pathname) + url.search;
  };

  public getSnapshot = (): RouterSnapshot<TMeta> => {
    return {
      navigate: this.navigate,
      navigateExternal: this.navigateExternal,
      navigateByName: this.navigateByName,
      buildPath: this.buildPath,

      back: this.back,
      forward: this.forward,
      go: this.go,
      hasRoute: this.hasRoute,
      resolveRoute: this.resolveRoute,

      params: this.currentParams(),
      searchParams: this.currentSearchParams(),
      route: {
        name: this.currentRouteName(),
        meta: this.currentMeta(),
      },
      location: {
        pathname: this.currentPathname(),
        hash: this.currentHash(),
        search: this.currentSearch(),
        state: this.currentHistoryState(),
      },

      isActive: this.isActive,
      isExact: this.isExact,
      isNameActive: this.isNameActive,

      setSearchParam: this.setSearchParam,
      appendSearchParam: this.appendSearchParam,
      deleteSearchParam: this.deleteSearchParam,
      patchSearchParams: this.patchSearchParams,
      replaceAllSearchParams: this.replaceAllSearchParams,
      getSearchParam: this.getSearchParam,
      getAllSearchParams: this.getAllSearchParams,
      hasSearchParam: this.hasSearchParam,
    };
  };

  protected handlePopState = (): void => {
    this.saveCurrentScrollPosition();

    const previousFullPath = this.currentPathname() + this.currentSearch();
    const previousHash = this.currentHash();
    const previousState = this.currentHistoryState();
    const previousHistoryKey = this.currentHistoryKey;

    const nextFullPath = this.getCurrentFullPath();
    const nextHash = window.location.hash;
    const { key: nextKey, data: nextUserState } = this.readHistoryState(
      window.history.state,
    );

    const savedPosition = this.scrollPositions.get(nextKey) ?? null;
    this.currentHistoryKey = nextKey;

    const samePath = previousFullPath === nextFullPath;

    if (this.confirmLeaveHook && !samePath) {
      const parsedNext = this.parseUrl(
        new URL(nextFullPath + nextHash, window.location.origin),
      );
      const to: NavigationLocation = {
        pathname: parsedNext.pathname,
        search: parsedNext.search,
        hash: parsedNext.hash,
        state: nextUserState,
      };
      if (!this.confirmLeaveHook(to, this.captureCurrentRouteState())) {
        this.currentHistoryKey = previousHistoryKey;
        window.history.replaceState(
          this.wrapState(previousState, previousHistoryKey),
          '',
          previousFullPath + previousHash,
        );
        this.notifyNavigationBlocked(to);
        return;
      }
    }

    if (samePath) {
      this.currentHash(nextHash);
      this.currentHistoryState(nextUserState);
      this.notifyAfterNavigate(this.captureCurrentRouteState());
      this.scheduleScrollToFragment(nextHash);
      return;
    }

    const originalUrl = this.parseUrl(
      new URL(nextFullPath + nextHash, window.location.origin),
    );
    const result = this.resolvePath(nextFullPath, nextUserState);

    this.handleResolveResult(result, {
      onBlocked: () => {
        this.currentHistoryKey = previousHistoryKey;
        window.history.replaceState(
          this.wrapState(previousState, previousHistoryKey),
          '',
          previousFullPath + previousHash,
        );
        this.notifyNavigationBlocked({
          pathname: originalUrl.pathname,
          search: originalUrl.search,
          hash: nextHash,
          state: nextUserState,
        });
      },
      onRedirect: (res) => {
        if (this.normalizeFullPath(res.to) === nextFullPath) {
          this.currentHistoryKey = previousHistoryKey;
          window.history.replaceState(
            this.wrapState(previousState, previousHistoryKey),
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
        this.resolveRewrite(originalUrl, res.to, nextUserState, savedPosition);
      },
      onError: (res) => {
        const handled = this.notifyNavigationError(res.error, {
          pathname: originalUrl.pathname,
          search: originalUrl.search,
          hash: nextHash,
          state: nextUserState,
        });
        if (!handled) throw res.error;
      },
      onResolved: (res) => {
        const nextRouteState = { ...res.value, hash: nextHash };
        this.applyState(nextRouteState);
        this.notifyAfterNavigate(nextRouteState);
        this.handleScroll(nextRouteState, savedPosition);
      },
    });
  };

  protected resolveRewrite = (
    originalUrl: {
      pathname: string;
      search: string;
      hash: string;
      searchParams: SearchParams;
    },
    rewriteTo: string,
    state: unknown,
    savedPosition: ScrollPosition | null = null,
    depth: number = 0,
  ): void => {
    if (depth > 10) {
      throw new Error(
        `BaseRouter: maximum rewrite depth exceeded at "${rewriteTo}"`,
      );
    }

    const result = this.resolvePath(rewriteTo, state);

    this.handleResolveResult(result, {
      onBlocked: () => {
        this.notifyNavigationBlocked({
          pathname: originalUrl.pathname,
          search: originalUrl.search,
          hash: originalUrl.hash,
          state,
        });
      },
      onRedirect: (res) => {
        this.navigate(res.to, { replace: res.replace ?? false, state });
      },
      onRewrite: (res) => {
        this.resolveRewrite(
          originalUrl,
          res.to,
          state,
          savedPosition,
          depth + 1,
        );
      },
      onError: (res) => {
        const handled = this.notifyNavigationError(res.error, {
          pathname: originalUrl.pathname,
          search: originalUrl.search,
          hash: originalUrl.hash,
          state,
        });
        if (!handled) throw res.error;
      },
      onResolved: (res) => {
        const nextRouteState = {
          pathname: originalUrl.pathname,
          search: originalUrl.search,
          searchParams: originalUrl.searchParams,
          hash: originalUrl.hash,
          component: res.value.component,
          params: res.value.params,
          state,
          name: res.value.name,
          meta: res.value.meta,
        };
        this.applyState(nextRouteState);
        this.notifyAfterNavigate(nextRouteState);
        this.handleScroll(nextRouteState, savedPosition);
      },
    });
  };

  protected resolvePath = (
    fullPath: string,
    state: unknown,
  ): ResolveResult<TMeta> => {
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

      if (
        route.paramValidators &&
        !this.validateParams(match, route.paramValidators)
      )
        continue;

      const queryResult = this.applyQueryParamConfig(
        searchParams,
        route.queryParams,
      );
      if (!queryResult.valid) {
        return { type: ResolveResultType.Blocked };
      }

      const middlewareResult = this.runMiddlewares(route.middlewares ?? [], {
        pathname,
        search,
        state,
        meta: route.meta,
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
          searchParams: queryResult.searchParams,
          state,
          name: route.name,
          meta: route.meta,
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
        name: undefined,
        meta: undefined,
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
    searchParams: SearchParams;
    hash: string;
  } => {
    const searchParams: SearchParams = {};

    url.searchParams.forEach((value, key) => {
      const existing = searchParams[key];
      if (existing === undefined) {
        searchParams[key] = value;
      } else if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        searchParams[key] = [existing, value];
      }
    });

    return {
      pathname: this.normalizePath(url.pathname),
      search: url.search,
      searchParams,
      hash: url.hash,
    };
  };

  protected normalizePath = (path: string): string => {
    if (!path || path === '/') {
      return '/';
    }

    return path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
  };

  protected applyState = (nextState: ResolvedRouteState<TMeta>): void => {
    this.previousRouteState = this.captureCurrentRouteState();
    this.currentPathname(nextState.pathname);
    this.currentSearch(nextState.search);
    this.currentHash(nextState.hash);
    this.currentComponent(nextState.component);
    this.currentParams(nextState.params);
    this.currentSearchParams(nextState.searchParams);
    this.currentHistoryState(nextState.state);
    this.currentRouteName(nextState.name);
    this.currentMeta(nextState.meta);
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
    middlewares: RouteMiddleware<TMeta>[],
    context: RouteMiddlewareContext<TMeta>,
  ): RouteMiddlewareResult<TMeta> => {
    for (const middleware of middlewares) {
      const result = middleware(context);
      if (result) return result;
    }
  };

  protected handleResolveResult = (
    result: ResolveResult<TMeta>,
    options: {
      onBlocked: (result: BlockedResult) => void;
      onError: (result: ErrorResult) => void;
      onRedirect: (result: RedirectResult) => void;
      onRewrite: (result: RewriteResult) => void;
      onResolved: (result: ResolvedResult<TMeta>) => void;
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

  protected getCurrentFullPath = (): string => {
    return (
      this.normalizePath(window.location.pathname) + window.location.search
    );
  };

  protected rankRoutes = (
    routes: RouteConfig<TMeta>[],
  ): RouteConfig<TMeta>[] => {
    const names = routes.map((r) => r.name).filter(Boolean);
    const duplicates = names.filter((n, i) => names.indexOf(n) !== i);
    if (duplicates.length > 0) {
      throw new Error(
        `BaseRouter: duplicate route names found: ${[...new Set(duplicates)].join(', ')}`,
      );
    }

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

  protected generateHistoryKey = (): string => {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  };

  protected wrapState = (
    userState: unknown,
    key?: string,
  ): InternalHistoryState => ({
    __routerKey: key ?? this.generateHistoryKey(),
    data: userState,
  });

  protected readHistoryState = (
    raw: unknown,
  ): { key: string; data: unknown } => {
    if (
      raw !== null &&
      typeof raw === 'object' &&
      '__routerKey' in (raw as object)
    ) {
      const entry = raw as InternalHistoryState;
      return { key: entry.__routerKey, data: entry.data };
    }
    return { key: this.generateHistoryKey(), data: raw };
  };

  protected saveCurrentScrollPosition = (): void => {
    if (!this.currentHistoryKey) return;
    this.scrollPositions.set(this.currentHistoryKey, {
      x: window.scrollX,
      y: window.scrollY,
    });

    if (this.scrollPositions.size > 50) {
      const firstKey = this.scrollPositions.keys().next().value;
      if (firstKey) this.scrollPositions.delete(firstKey);
    }
  };

  protected captureCurrentRouteState = (): ResolvedRouteState<TMeta> => ({
    pathname: this.currentPathname(),
    search: this.currentSearch(),
    hash: this.currentHash(),
    component: this.currentComponent(),
    params: this.currentParams(),
    searchParams: this.currentSearchParams(),
    state: this.currentHistoryState(),
    name: this.currentRouteName(),
    meta: this.currentMeta(),
  });

  protected applyScrollTarget = (target: ScrollTarget): void => {
    if (!target || target === 'preserve') return;

    requestAnimationFrame(() => {
      if (target === 'top') {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        return;
      }
      window.scrollTo({ top: target.y, left: target.x, behavior: 'instant' });
    });
  };

  protected handleScroll = (
    to: ResolvedRouteState<TMeta>,
    savedPosition: ScrollPosition | null,
  ): void => {
    if (to.hash) {
      this.scheduleScrollToFragment(to.hash);
      return;
    }

    const target = this.scrollBehavior(
      to,
      this.previousRouteState,
      savedPosition,
    );
    this.applyScrollTarget(target);
  };

  protected getCurrentSearchInstance = (): URLSearchParams => {
    return new URLSearchParams(this.currentSearch());
  };

  protected buildUrlWithSearch = (search: URLSearchParams): string => {
    const path =
      this.currentPathname() +
      (search.toString() ? `?${search.toString()}` : '');
    return path + this.currentHash();
  };

  public getSearchParam = (key: string): string | null => {
    return this.getCurrentSearchInstance().get(key);
  };

  public getAllSearchParams = (key: string): string[] => {
    return this.getCurrentSearchInstance().getAll(key);
  };

  public hasSearchParam = (key: string): boolean => {
    return this.getCurrentSearchInstance().has(key);
  };

  public setSearchParam = (
    key: string,
    value: string,
    options?: NavigateOptions,
  ): void => {
    const search = this.getCurrentSearchInstance();
    search.set(key, value);
    this.navigate(this.buildUrlWithSearch(search), {
      replace: options?.replace ?? true,
      state: options?.state ?? this.currentHistoryState(),
    });
  };

  public appendSearchParam = (
    key: string,
    value: string,
    options?: NavigateOptions,
  ): void => {
    const search = this.getCurrentSearchInstance();
    search.append(key, value);
    this.navigate(this.buildUrlWithSearch(search), {
      replace: options?.replace ?? true,
      state: options?.state ?? this.currentHistoryState(),
    });
  };

  public deleteSearchParam = (
    key: string,
    value?: string,
    options?: NavigateOptions,
  ): void => {
    const search = this.getCurrentSearchInstance();

    if (value !== undefined) {
      const remaining = search.getAll(key).filter((v) => v !== value);
      search.delete(key);
      remaining.forEach((v) => search.append(key, v));
    } else {
      search.delete(key);
    }

    this.navigate(this.buildUrlWithSearch(search), {
      replace: options?.replace ?? true,
      state: options?.state ?? this.currentHistoryState(),
    });
  };

  public patchSearchParams = (
    patch: SearchParamsPatch,
    options?: NavigateOptions,
  ): void => {
    const search = this.getCurrentSearchInstance();

    Object.entries(patch).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        search.delete(key);
      } else if (Array.isArray(value)) {
        search.delete(key);
        value.forEach((v) => search.append(key, v));
      } else {
        search.set(key, value);
      }
    });

    this.navigate(this.buildUrlWithSearch(search), {
      replace: options?.replace ?? true,
      state: options?.state ?? this.currentHistoryState(),
    });
  };

  public replaceAllSearchParams = (
    params: SearchParams,
    options?: NavigateOptions,
  ): void => {
    const search = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => search.append(key, v));
      } else {
        search.set(key, value);
      }
    });

    this.navigate(this.buildUrlWithSearch(search), {
      replace: options?.replace ?? true,
      state: options?.state ?? this.currentHistoryState(),
    });
  };

  public buildPath = (
    name: string,
    params?: RouteParams,
    search?: BuildPathSearch,
    hash?: string,
  ): string => {
    const route = this.routes.find((r) => r.name === name);

    if (!route) {
      throw new Error(`BaseRouter.buildPath: route "${name}" not found`);
    }

    const segments = this.normalizePath(route.pattern)
      .split('/')
      .filter(Boolean);
    const resultSegments: string[] = [];

    for (const segment of segments) {
      if (this.isWildcardSegment(segment)) {
        const paramName = this.getWildcardParamName(segment);
        const value = params?.[paramName];
        if (value !== undefined) {
          resultSegments.push(String(value));
        }
        break;
      }

      if (segment.startsWith(':')) {
        const isOptional = segment.endsWith('?');
        const paramName = segment.slice(1, isOptional ? -1 : undefined);
        const value = params?.[paramName];

        if (value !== undefined) {
          resultSegments.push(encodeURIComponent(String(value)));
        } else if (!isOptional) {
          throw new Error(
            `BaseRouter.buildPath: missing required param "${paramName}" for route "${name}"`,
          );
        }
        continue;
      }

      resultSegments.push(segment);
    }

    const pathname = '/' + resultSegments.join('/');
    const hashStr = hash ? (hash.startsWith('#') ? hash : `#${hash}`) : '';

    if (!search) return `${pathname}${hashStr}`;

    const sp =
      search instanceof URLSearchParams
        ? search
        : (() => {
            const instance = new URLSearchParams();
            Object.entries(search).forEach(([key, value]) => {
              if (Array.isArray(value)) {
                value.forEach((v) => instance.append(key, v));
              } else {
                instance.set(key, value);
              }
            });
            return instance;
          })();

    const searchStr = sp.toString();
    return searchStr
      ? `${pathname}?${searchStr}${hashStr}`
      : `${pathname}${hashStr}`;
  };

  public navigateByName = (
    name: string,
    params?: RouteParams,
    search?: SearchParams,
    hash?: string,
    options?: NavigateOptions,
  ): void => {
    const path = this.buildPath(name, params, search, hash);
    this.navigate(path, options);
  };

  protected notifyAfterNavigate = (to: ResolvedRouteState<TMeta>): void => {
    this.afterNavigateHook?.(to, this.previousRouteState);
  };

  protected notifyNavigationBlocked = (to: NavigationLocation): void => {
    this.onNavigationBlockedHook?.(to, this.captureCurrentRouteState());
  };

  protected notifyNavigationError = (
    error: unknown,
    to: NavigationLocation,
  ): boolean => {
    return this.onNavigationErrorHook?.(error, to) === true;
  };

  public isActive = (path: string): boolean => {
    const normalized = this.normalizePath(
      new URL(path.startsWith('/') ? path : `/${path}`, window.location.origin)
        .pathname,
    );
    const current = this.currentPathname();
    return current === normalized || current.startsWith(normalized + '/');
  };

  public isExact = (path: string): boolean => {
    const normalized = this.normalizePath(
      new URL(path.startsWith('/') ? path : `/${path}`, window.location.origin)
        .pathname,
    );
    return this.currentPathname() === normalized;
  };

  public isNameActive = (name: string): boolean => {
    return this.currentRouteName() === name;
  };

  public back = (): void => {
    window.history.back();
  };

  public forward = (): void => {
    window.history.forward();
  };

  public go = (delta: number): void => {
    window.history.go(delta);
  };

  public hasRoute = (name: string): boolean => {
    return this.routes.some((r) => r.name === name);
  };

  protected validateParams = (
    params: RouteParams,
    validators: Record<string, RegExp | string[]>,
  ): boolean => {
    return Object.entries(validators).every(([key, validator]) => {
      const value = params[key];
      if (value === undefined) return true;
      if (Array.isArray(validator)) return validator.includes(value);
      return validator.test(value);
    });
  };

  protected applyQueryParamConfig = (
    searchParams: SearchParams,
    config?: Record<string, QueryParamConfig>,
  ): { valid: boolean; searchParams: SearchParams } => {
    if (!config) return { valid: true, searchParams };

    const result: SearchParams = { ...searchParams };

    for (const [key, paramConfig] of Object.entries(config)) {
      if (result[key] === undefined) {
        if (paramConfig.required && paramConfig.default === undefined) {
          return { valid: false, searchParams: result };
        }
        if (paramConfig.default !== undefined) {
          result[key] = paramConfig.default;
        }
      }
    }

    return { valid: true, searchParams: result };
  };

  public resolveRoute = (path: string): ResolvedRouteInfo<TMeta> | null => {
    let url: URL;
    try {
      url = this.resolveTo(path);
    } catch {
      return null;
    }

    const { pathname } = this.parseUrl(url);

    for (const route of this.routes) {
      const match = this.matchRoute(route.pattern, pathname);
      if (!match) continue;
      if (
        route.paramValidators &&
        !this.validateParams(match, route.paramValidators)
      )
        continue;

      return {
        name: route.name,
        meta: route.meta as TMeta | undefined,
        component: route.component,
        params: match,
        pattern: route.pattern,
      };
    }

    return null;
  };

  public navigateExternal = (
    url: string,
    options?: NavigateExternalOptions,
  ): void => {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error(`BaseRouter.navigateExternal: invalid URL "${url}"`);
    }

    if (!['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol)) {
      throw new Error(
        `BaseRouter.navigateExternal: unsafe protocol "${parsed.protocol}"`,
      );
    }

    if (parsed.origin === window.location.origin) {
      this.navigate(parsed.pathname + parsed.search + parsed.hash);
      return;
    }

    if (options?.target === '_blank') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = url;
    }
  };
}

import { ko } from '@/shared/lib/ko';
import type {
  AfterNavigateHook,
  NavigateExternalOptions,
  NavigateOptions,
  NavigationBlockedHook,
  NavigationErrorHook,
  NavigationLocation,
  ParsedURL,
  ResolvedRoute,
  RouteConfig,
  RouteMiddleware,
  RouteParams,
  RouteResolutionResult,
  RouterOptions,
  RouterSnapshot,
  RouteSearchParams,
  RouteState,
  ScrollBehaviorMeta,
  ScrollBehaviorOptions,
} from './types';
import {
  addBase,
  AllowedURLProtocols,
  applyQueryParamConfig,
  buildPathByRoute,
  defaultScrollBehavior,
  generateHistoryStateKey,
  getFullPath,
  handleResolveResult,
  matchRoute,
  normalizeBase,
  normalizeFullPath,
  normalizePath,
  parseUrl,
  rankRoutes,
  readHistoryState,
  resolveComparator,
  ResolveResultType,
  resolveTo,
  runMiddlewares,
  sanitizePath,
  scrollToFragment,
  scrollToTarget,
  stripBase,
  validateParams,
  wrapHistoryState,
} from './utils';

export class BaseRouter<
  TMeta extends Record<string, unknown> = Record<string, unknown>,
> {
  public readonly routes: RouteConfig<TMeta>[];
  protected readonly base: string;
  protected readonly caseSensitive: boolean;
  protected readonly middlewares: RouteMiddleware<TMeta>[];
  protected readonly scrollBehavior: (
    meta?: ScrollBehaviorMeta<TMeta> | undefined,
  ) => ScrollBehaviorOptions | null;
  protected readonly stateCompare: (a: unknown, b: unknown) => boolean;
  protected readonly afterNavigateHook: AfterNavigateHook<TMeta> | undefined;
  protected readonly onNavigationBlockedHook:
    | NavigationBlockedHook<TMeta>
    | undefined;
  protected readonly onNavigationErrorHook: NavigationErrorHook | undefined;
  protected readonly confirmLeaveHook:
    | ((to: NavigationLocation, from: RouteState<TMeta> | null) => boolean)
    | undefined;
  protected readonly enableBeforeUnload: boolean;
  protected scrollOptions = new Map<string, ScrollBehaviorOptions | null>();
  protected currentHistoryKey: string = '';
  protected previousRouteState: RouteState<TMeta> | null = null;
  protected isStarted: boolean = false;

  public currentComponent: KnockoutObservable<string>;
  public currentParams: KnockoutObservable<RouteParams>;
  public currentPathname: KnockoutObservable<string>;
  public currentSearch: KnockoutObservable<string>;
  public currentSearchParams: KnockoutObservable<RouteSearchParams>;
  public currentHistoryState: KnockoutObservable<unknown>;
  public currentHash: KnockoutObservable<string>;
  public currentRouteName: KnockoutObservable<string | undefined>;
  public currentMeta: KnockoutObservable<TMeta | undefined>;
  public currentPattern: KnockoutObservable<string | undefined>;

  protected constructor(options?: RouterOptions<TMeta>) {
    this.routes = rankRoutes(options?.routes ?? []);
    this.base = normalizeBase(options?.base ?? '');
    this.caseSensitive = options?.caseSensitive ?? false;
    this.middlewares = options?.middlewares || [];
    this.scrollBehavior = options?.scrollBehavior ?? defaultScrollBehavior;
    this.stateCompare = resolveComparator(options?.stateCompare);
    this.afterNavigateHook = options?.afterNavigate;
    this.onNavigationBlockedHook = options?.onNavigationBlocked;
    this.onNavigationErrorHook = options?.onNavigationError;
    this.confirmLeaveHook = options?.confirmLeave;
    this.enableBeforeUnload = options?.confirmLeave
      ? (options?.enableBeforeUnload ?? true)
      : false;

    const initialUrl = new URL(window.location.href);
    const strippedPathname = normalizePath(
      stripBase(initialUrl.pathname, this.base),
    );
    const initialMatch = this.routes.find((r) =>
      matchRoute(r.pattern, strippedPathname, this.caseSensitive),
    );

    this.currentComponent = ko.observable(initialMatch?.component ?? '');
    this.currentRouteName = ko.observable(initialMatch?.name);
    this.currentMeta = ko.observable(initialMatch?.meta);
    this.currentParams = ko.observable({});
    this.currentPattern = ko.observable(initialMatch?.pattern);
    this.currentPathname = ko.observable(strippedPathname);
    this.currentSearch = ko.observable(initialUrl.search);
    this.currentSearchParams = ko.observable(parseUrl(initialUrl).searchParams);
    this.currentHistoryState = ko.observable(
      readHistoryState(window.history.state).data,
    );
    this.currentHash = ko.observable(initialUrl.hash);
  }

  public start = (): void => {
    if (this.isStarted) return;
    this.isStarted = true;

    window.history.scrollRestoration = 'manual';
    window.addEventListener('popstate', this.handlePopState);
    if (this.enableBeforeUnload)
      window.addEventListener('beforeunload', this.handleBeforeUnload);

    const fullPath = getFullPath(this.base);
    const initialHash = window.location.hash;
    const rawState = window.history.state;
    const { key, data: userState } = readHistoryState(rawState);
    this.currentHistoryKey = key;

    if (!rawState || !('key' in Object(rawState))) {
      window.history.replaceState(
        wrapHistoryState(userState, key),
        '',
        addBase(fullPath, this.base) + initialHash,
      );
    }

    const originalUrl = parseUrl(
      new URL(fullPath + initialHash, window.location.origin),
    );
    const result = this.resolvePath(fullPath, userState);

    handleResolveResult(result, {
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
        this.handleScroll({
          to: nextState,
          from: this.previousRouteState,
          options: null,
        });
      },
    });
  };

  public dispose = (): void => {
    if (!this.isStarted) return;
    this.isStarted = false;

    window.history.scrollRestoration = 'auto';
    window.removeEventListener('popstate', this.handlePopState);
    if (this.enableBeforeUnload)
      window.removeEventListener('beforeunload', this.handleBeforeUnload);
  };

  protected handleBeforeUnload = (event: BeforeUnloadEvent): void => {
    event.preventDefault();
    event.returnValue = '';
  };

  public navigate = (
    path: string,
    options?: NavigateOptions | undefined,
  ): void => {
    const nextUrl = resolveTo(
      path,
      this.currentPathname(),
      this.currentSearch(),
    );

    if (nextUrl.origin !== window.location.origin)
      throw new Error(`Cross-origin path "${path}" is not allowed`);

    const nextFullPath = normalizePath(nextUrl.pathname) + nextUrl.search;
    const nextHash = nextUrl.hash;

    const currentFullPath = getFullPath(this.base);

    const { data: currentUserState } = readHistoryState(window.history.state);
    const nextState = options?.state ?? null;

    const comparator = options?.stateCompare
      ? resolveComparator(options.stateCompare)
      : this.stateCompare;

    const samePath = currentFullPath === nextFullPath;
    const sameState = comparator(currentUserState, nextState);
    const sameHash = this.currentHash() === nextHash;

    if (!options?.force && samePath && sameState && sameHash) return;

    if (this.confirmLeaveHook && !samePath) {
      const to: NavigationLocation = {
        pathname: normalizePath(nextUrl.pathname),
        search: nextUrl.search,
        hash: nextHash,
        state: options?.state ?? null,
      };
      if (!this.confirmLeaveHook(to, this.captureCurrentRouteState())) return;
    }

    if (samePath && sameState && !sameHash) {
      const fullUrlWithHash = addBase(currentFullPath, this.base) + nextHash;

      this.pushOrReplace(fullUrlWithHash, nextState, options?.replace);

      this.currentHash(nextHash);
      this.currentHistoryState(nextState);
      this.notifyAfterNavigate(this.captureCurrentRouteState());
      scrollToFragment(nextHash, null);
      return;
    }

    const result = this.resolvePath(nextFullPath, nextState);
    const originalUrl = parseUrl(
      new URL(nextFullPath + nextHash, window.location.origin),
    );

    handleResolveResult(result, {
      onBlocked: () => {
        this.notifyNavigationBlocked({
          pathname: originalUrl.pathname,
          search: originalUrl.search,
          hash: nextHash,
          state: nextState,
        });
      },
      onRedirect: (res) => {
        if (normalizeFullPath(res.to, this.base) === nextFullPath) return;

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
        const normalizedPath =
          addBase(res.value.pathname + res.value.search, this.base) + nextHash;

        this.pushOrReplace(normalizedPath, nextState, options?.replace);

        const nextRouteState = { ...res.value, hash: nextHash };
        this.applyState(nextRouteState);
        this.notifyAfterNavigate(nextRouteState);
        this.handleScroll({
          to: nextRouteState,
          from: this.previousRouteState,
          options: null,
        });
      },
    });
  };

  protected pushOrReplace = (
    path: string,
    state: unknown,
    replace?: boolean,
  ): void => {
    if (replace) {
      window.history.replaceState(
        wrapHistoryState(state, this.currentHistoryKey),
        '',
        path,
      );
    } else {
      this.saveCurrentScrollPosition();
      const key = generateHistoryStateKey();
      this.currentHistoryKey = key;
      window.history.pushState(wrapHistoryState(state, key), '', path);
    }
  };

  public getSnapshot = (): RouterSnapshot<TMeta> => {
    return {
      navigate: this.navigate,
      navigateExternal: this.navigateExternal,
      buildPath: this.buildPath,
      createHref: this.createHref,
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
        pattern: this.currentPattern(),
      },
      location: {
        pathname: this.currentPathname(),
        hash: this.currentHash(),
        search: this.currentSearch(),
        state: this.currentHistoryState(),
      },

      isActive: this.isActive,
      isExact: this.isExact,

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

    const nextFullPath = getFullPath(this.base);
    const nextHash = window.location.hash;
    const { key: nextKey, data: nextUserState } = readHistoryState(
      window.history.state,
    );

    const savedScrollOption = this.scrollOptions.get(nextKey) ?? null;
    this.currentHistoryKey = nextKey;

    const samePath = previousFullPath === nextFullPath;

    if (this.confirmLeaveHook && !samePath) {
      const parsedNext = parseUrl(
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
          wrapHistoryState(previousState, previousHistoryKey),
          '',
          addBase(previousFullPath, this.base) + previousHash,
        );
        this.notifyNavigationBlocked(to);
        return;
      }
    }

    if (samePath) {
      this.currentHash(nextHash);
      this.currentHistoryState(nextUserState);
      this.notifyAfterNavigate(this.captureCurrentRouteState());
      scrollToFragment(nextHash, null);
      return;
    }

    const originalUrl = parseUrl(
      new URL(nextFullPath + nextHash, window.location.origin),
    );
    const result = this.resolvePath(nextFullPath, nextUserState);

    handleResolveResult(result, {
      onBlocked: () => {
        this.rollbackHistory(
          previousHistoryKey,
          previousState,
          previousFullPath,
          previousHash,
        );
        this.notifyNavigationBlocked({
          pathname: originalUrl.pathname,
          search: originalUrl.search,
          hash: nextHash,
          state: nextUserState,
        });
      },
      onRedirect: (res) => {
        if (normalizeFullPath(res.to, this.base) === nextFullPath) {
          this.rollbackHistory(
            previousHistoryKey,
            previousState,
            previousFullPath,
            previousHash,
          );
          return;
        }

        this.navigate(res.to, {
          replace: res.replace ?? false,
          state: null,
        });
      },
      onRewrite: (res) => {
        this.resolveRewrite(
          originalUrl,
          res.to,
          nextUserState,
          savedScrollOption,
        );
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
        this.handleScroll({
          to: nextRouteState,
          from: this.previousRouteState,
          options: savedScrollOption,
        });
      },
    });
  };

  protected rollbackHistory(
    key: string,
    state: unknown,
    fullPath: string,
    hash: string,
  ): void {
    this.currentHistoryKey = key;
    window.history.replaceState(
      wrapHistoryState(state, key),
      '',
      addBase(fullPath, this.base) + hash,
    );
  }

  protected resolveRewrite = (
    originalUrl: ParsedURL,
    rewriteTo: string,
    state: unknown,
    scrollOptions: ScrollBehaviorOptions | null = null,
    depth: number = 0,
  ): void => {
    if (depth > 10)
      throw new Error(`Maximum rewrite depth exceeded at "${rewriteTo}"`);

    const result = this.resolvePath(rewriteTo, state);

    handleResolveResult(result, {
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
          scrollOptions,
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
          pattern: res.value.pattern,
        };
        this.applyState(nextRouteState);
        this.notifyAfterNavigate(nextRouteState);
        this.handleScroll({
          to: nextRouteState,
          from: this.previousRouteState,
          options: scrollOptions,
        });
      },
    });
  };

  protected resolvePath = (
    fullPath: string,
    state: unknown,
  ): RouteResolutionResult<TMeta> => {
    const url = new URL(fullPath, window.location.origin);
    const { pathname, search, searchParams, hash } = parseUrl(url);

    const globalMiddlewareResult = runMiddlewares(this.middlewares, {
      pathname,
      search,
      state,
    });

    if (globalMiddlewareResult) return globalMiddlewareResult;

    for (const route of this.routes) {
      const match = matchRoute(route.pattern, pathname, this.caseSensitive);

      if (!match) continue;

      if (
        route.paramValidators &&
        !validateParams(match, route.paramValidators)
      )
        continue;

      const queryResult = applyQueryParamConfig(
        searchParams,
        route.queryParams,
      );
      if (!queryResult.valid) continue;

      const middlewareResult = runMiddlewares(route.middlewares ?? [], {
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
          pattern: route.pattern,
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
        pattern: undefined,
      },
    };
  };

  protected applyState = (nextState: RouteState<TMeta>): void => {
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
    this.currentPattern(nextState.pattern);
  };

  protected saveCurrentScrollPosition = (): void => {
    if (!this.currentHistoryKey) return;
    this.scrollOptions.set(this.currentHistoryKey, {
      top: window.scrollX,
      left: window.scrollY,
      behavior: 'smooth',
    });

    if (this.scrollOptions.size > 50) {
      const firstKey = this.scrollOptions.keys().next().value;
      if (firstKey) this.scrollOptions.delete(firstKey);
    }
  };

  protected captureCurrentRouteState = (): RouteState<TMeta> => ({
    pathname: this.currentPathname(),
    search: this.currentSearch(),
    hash: this.currentHash(),
    component: this.currentComponent(),
    params: this.currentParams(),
    searchParams: this.currentSearchParams(),
    state: this.currentHistoryState(),
    name: this.currentRouteName(),
    meta: this.currentMeta(),
    pattern: this.currentPattern(),
  });

  protected handleScroll = (meta: ScrollBehaviorMeta<TMeta>): void => {
    if (meta.to?.hash) scrollToFragment(meta.to.hash, meta.options);
    else scrollToTarget(this.scrollBehavior(meta));
  };

  protected getCurrentSearchInstance = (): URLSearchParams => {
    return new URLSearchParams(this.currentSearch());
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

  protected buildUrlWithSearch = (search: URLSearchParams): string => {
    return (
      this.currentPathname() +
      (search.toString() ? `?${search.toString()}` : '') +
      this.currentHash()
    );
  };

  protected mutateSearchParam = (
    mutate: (s: URLSearchParams) => void,
    options?: NavigateOptions,
  ) => {
    const search = this.getCurrentSearchInstance();
    mutate(search);
    this.navigate(this.buildUrlWithSearch(search), {
      replace: options?.replace ?? true,
      state: options?.state ?? this.currentHistoryState(),
    });
  };

  public setSearchParam = (
    key: string,
    value: string,
    options?: NavigateOptions,
  ): void => {
    this.mutateSearchParam((s) => s.set(key, value), options);
  };

  public appendSearchParam = (
    key: string,
    value: string,
    options?: NavigateOptions,
  ): void => {
    this.mutateSearchParam((s) => s.append(key, value), options);
  };

  public deleteSearchParam = (
    key: string,
    value?: string,
    options?: NavigateOptions,
  ): void => {
    this.mutateSearchParam((s) => {
      if (value !== undefined) {
        const remaining = s.getAll(key).filter((v) => v !== value);
        s.delete(key);
        remaining.forEach((v) => s.append(key, v));
      } else {
        s.delete(key);
      }
    }, options);
  };

  public patchSearchParams = (
    patch: Record<string, string | string[] | null | undefined>,
    options?: NavigateOptions,
  ): void => {
    this.mutateSearchParam((s) => {
      Object.entries(patch).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          s.delete(key);
        } else if (Array.isArray(value)) {
          s.delete(key);
          value.forEach((v) => s.append(key, v));
        } else {
          s.set(key, value);
        }
      });
    }, options);
  };

  public replaceAllSearchParams = (
    params: RouteSearchParams,
    options?: NavigateOptions,
  ): void => {
    const search = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) value.forEach((v) => search.append(key, v));
      else search.set(key, value);
    });

    this.navigate(this.buildUrlWithSearch(search), {
      replace: options?.replace ?? true,
      state: options?.state ?? this.currentHistoryState(),
    });
  };

  public buildPath = (
    name: string,
    params?: RouteParams,
    searchParams?: RouteSearchParams | URLSearchParams,
    hash?: string,
  ): string => {
    const route = this.routes.find((r) => r.name === name);

    if (!route) throw new Error(`Route "${name}" not found`);

    return buildPathByRoute(route, params, searchParams, hash);
  };

  protected notifyAfterNavigate = (to: RouteState<TMeta>): void => {
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
    const normalized = sanitizePath(path);
    const current = this.currentPathname();
    if (this.caseSensitive)
      return current === normalized || current.startsWith(normalized + '/');

    const n = normalized.toLowerCase();
    const c = current.toLowerCase();
    return c === n || c.startsWith(n + '/');
  };

  public isExact = (path: string): boolean => {
    const normalized = sanitizePath(path);
    const current = this.currentPathname();
    return this.caseSensitive
      ? current === normalized
      : current.toLowerCase() === normalized.toLowerCase();
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

  public resolveRoute = (
    path: string,
    options?: { runMiddlewares?: boolean },
  ): ResolvedRoute<TMeta> | null => {
    let url: URL;
    try {
      url = resolveTo(path, this.currentPathname(), this.currentSearch());
    } catch {
      return null;
    }

    const { pathname, searchParams } = parseUrl(url);

    if (options?.runMiddlewares) {
      const globalResult = runMiddlewares(this.middlewares, {
        pathname,
        search: url.search,
        state: null,
      });
      if (globalResult) return null;
    }

    for (const route of this.routes) {
      const match = matchRoute(route.pattern, pathname, this.caseSensitive);
      if (!match) continue;
      if (
        route.paramValidators &&
        !validateParams(match, route.paramValidators)
      )
        continue;

      const queryResult = applyQueryParamConfig(
        searchParams,
        route.queryParams,
      );
      if (!queryResult.valid) continue;

      if (options?.runMiddlewares && route.middlewares?.length) {
        const routeResult = runMiddlewares(route.middlewares, {
          pathname,
          search: url.search,
          state: null,
          meta: route.meta,
        });
        if (routeResult) {
          if (routeResult.type === ResolveResultType.Error) return null;
          else continue;
        }
      }

      return {
        name: route.name,
        meta: route.meta,
        component: route.component,
        params: match,
        pattern: route.pattern,
        searchParams: queryResult.searchParams,
      };
    }

    return null;
  };

  public navigateExternal = (
    path: string,
    options?: NavigateExternalOptions,
  ): void => {
    const url = new URL(path);

    if (
      !options?.allowAnyProtocol &&
      !AllowedURLProtocols.includes(url.protocol)
    )
      throw new Error(`Not allowed protocol "${url.protocol}"`);

    if (url.origin === window.location.origin) {
      this.navigate(stripBase(url.pathname, this.base) + url.search + url.hash);
      return;
    }

    if (options?.target === '_blank')
      window.open(url, '_blank', 'noopener,noreferrer');
    else window.location.href = url.href;
  };

  public createHref = (path: string): string => {
    const url = resolveTo(path, this.currentPathname(), this.currentSearch());
    return (
      addBase(normalizePath(url.pathname), this.base) + url.search + url.hash
    );
  };
}

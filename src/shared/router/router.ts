import { ko } from '@/shared/lib/ko';
import type {
  AfterNavigateHook,
  BlockedResult,
  BuildPathSearch,
  ErrorResult,
  NavigateExternalOptions,
  NavigateOptions,
  NavigationBlockedHook,
  NavigationErrorHook,
  NavigationLocation,
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
  SearchParams,
  SearchParamsPatch,
} from './types';
import {
  addBase,
  applyQueryParamConfig,
  applyScrollTarget,
  defaultScrollBehavior,
  generateHistoryKey,
  getCurrentFullPath,
  getWildcardParamName,
  isWildcardSegment,
  matchRoute,
  normalizeBase,
  normalizeFullPath,
  normalizePath,
  parseUrl,
  rankRoutes,
  readHistoryState,
  resolveComparator,
  ResolveResultType,
  scheduleScrollToFragment,
  stripBase,
  validateParams,
  wrapState,
} from './utils';

export class BaseRouter<
  TMeta extends Record<string, unknown> = Record<string, unknown>,
> {
  public readonly routes: RouteConfig<TMeta>[];
  protected readonly base: string;
  protected readonly caseSensitive: boolean;
  protected readonly middlewares: RouteMiddleware<TMeta>[];
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
  protected scrollPositions = new Map<string, ScrollPosition>();
  protected currentHistoryKey: string = '';
  protected previousRouteState: ResolvedRouteState<TMeta> | null = null;
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

    const fullPath = getCurrentFullPath();
    const initialHash = window.location.hash;
    const rawState = window.history.state;
    const { key, data: userState } = readHistoryState(rawState);
    this.currentHistoryKey = key;

    if (!rawState || !('__routerKey' in Object(rawState))) {
      window.history.replaceState(
        wrapState(userState, key),
        '',
        addBase(fullPath, this.base) + initialHash,
      );
    }

    const originalUrl = parseUrl(
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
    const nextUrl = this.resolveTo(path);

    if (nextUrl.origin !== window.location.origin)
      throw new Error(
        `BaseRouter.navigate: cross-origin path "${path}" is not allowed`,
      );

    const nextFullPath = normalizePath(nextUrl.pathname) + nextUrl.search;
    const nextHash = nextUrl.hash;

    const currentFullPath = getCurrentFullPath();

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

      if (options?.replace) {
        window.history.replaceState(
          wrapState(nextState, this.currentHistoryKey),
          '',
          fullUrlWithHash,
        );
      } else {
        this.saveCurrentScrollPosition();
        const newKey = generateHistoryKey();
        this.currentHistoryKey = newKey;
        window.history.pushState(
          wrapState(nextState, newKey),
          '',
          fullUrlWithHash,
        );
      }

      this.currentHash(nextHash);
      this.currentHistoryState(nextState);
      this.notifyAfterNavigate(this.captureCurrentRouteState());
      scheduleScrollToFragment(nextHash);
      return;
    }

    const result = this.resolvePath(nextFullPath, nextState);
    const originalUrl = parseUrl(
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
        if (normalizeFullPath(res.to) === nextFullPath) return;

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

        if (options?.replace) {
          window.history.replaceState(
            wrapState(nextState, this.currentHistoryKey),
            '',
            normalizedPath,
          );
        } else {
          this.saveCurrentScrollPosition();
          const newKey = generateHistoryKey();
          this.currentHistoryKey = newKey;
          window.history.pushState(
            wrapState(nextState, newKey),
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

  public getSnapshot = (): RouterSnapshot<TMeta> => {
    return {
      navigate: this.navigate,
      navigateExternal: this.navigateExternal,
      navigateByName: this.navigateByName,
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

    const nextFullPath = getCurrentFullPath();
    const nextHash = window.location.hash;
    const { key: nextKey, data: nextUserState } = readHistoryState(
      window.history.state,
    );

    const savedPosition = this.scrollPositions.get(nextKey) ?? null;
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
          wrapState(previousState, previousHistoryKey),
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
      scheduleScrollToFragment(nextHash);
      return;
    }

    const originalUrl = parseUrl(
      new URL(nextFullPath + nextHash, window.location.origin),
    );
    const result = this.resolvePath(nextFullPath, nextUserState);

    this.handleResolveResult(result, {
      onBlocked: () => {
        this.currentHistoryKey = previousHistoryKey;
        window.history.replaceState(
          wrapState(previousState, previousHistoryKey),
          '',
          addBase(previousFullPath, this.base) + previousHash,
        );
        this.notifyNavigationBlocked({
          pathname: originalUrl.pathname,
          search: originalUrl.search,
          hash: nextHash,
          state: nextUserState,
        });
      },
      onRedirect: (res) => {
        if (normalizeFullPath(res.to) === nextFullPath) {
          this.currentHistoryKey = previousHistoryKey;
          window.history.replaceState(
            wrapState(previousState, previousHistoryKey),
            '',
            addBase(previousFullPath, this.base) + previousHash,
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
    if (depth > 10)
      throw new Error(
        `BaseRouter: maximum rewrite depth exceeded at "${rewriteTo}"`,
      );

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
          pattern: res.value.pattern,
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
    const { pathname, search, searchParams, hash } = parseUrl(url);

    const globalMiddlewareResult = this.runMiddlewares(this.middlewares, {
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

  protected resolveTo = (path: string): URL => {
    if (!path) throw new Error('BaseRouter.navigate: empty path');

    const origin = window.location.origin;
    const currentPathname = this.currentPathname();
    const currentSearch = this.currentSearch();

    if (path.startsWith('/')) return new URL(path, origin);

    if (path.startsWith('?'))
      return new URL(`${currentPathname}${path}`, origin);

    if (path.startsWith('#'))
      return new URL(`${currentPathname}${currentSearch}${path}`, origin);

    const basePath = currentPathname.endsWith('/')
      ? currentPathname
      : `${currentPathname}/`;

    return new URL(path, `${origin}${basePath}`);
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
    this.currentPattern(nextState.pattern);
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
    pattern: this.currentPattern(),
  });

  protected handleScroll = (
    to: ResolvedRouteState<TMeta>,
    savedPosition: ScrollPosition | null,
  ): void => {
    if (to.hash) {
      scheduleScrollToFragment(to.hash);
      return;
    }

    const target = this.scrollBehavior(
      to,
      this.previousRouteState,
      savedPosition,
    );
    applyScrollTarget(target);
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
    } else search.delete(key);

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
    search?: BuildPathSearch,
    hash?: string,
  ): string => {
    const route = this.routes.find((r) => r.name === name);

    if (!route)
      throw new Error(`BaseRouter.buildPath: route "${name}" not found`);

    const segments = normalizePath(route.pattern).split('/').filter(Boolean);
    const resultSegments: string[] = [];

    for (const segment of segments) {
      if (isWildcardSegment(segment)) {
        const paramName = getWildcardParamName(segment);
        const value = params?.[paramName];
        if (value !== undefined) resultSegments.push(String(value));

        break;
      }

      if (segment.startsWith(':')) {
        const isOptional = segment.endsWith('?');
        const paramName = segment.slice(1, isOptional ? -1 : undefined);
        const value = params?.[paramName];

        if (value !== undefined)
          resultSegments.push(encodeURIComponent(String(value)));
        else if (!isOptional)
          throw new Error(
            `BaseRouter.buildPath: missing required param "${paramName}" for route "${name}"`,
          );

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
    const normalized = normalizePath(
      new URL(path.startsWith('/') ? path : `/${path}`, window.location.origin)
        .pathname,
    );
    const current = this.currentPathname();
    if (this.caseSensitive)
      return current === normalized || current.startsWith(normalized + '/');

    const n = normalized.toLowerCase();
    const c = current.toLowerCase();
    return c === n || c.startsWith(n + '/');
  };

  public isExact = (path: string): boolean => {
    const normalized = normalizePath(
      new URL(path.startsWith('/') ? path : `/${path}`, window.location.origin)
        .pathname,
    );
    const current = this.currentPathname();
    return this.caseSensitive
      ? current === normalized
      : current.toLowerCase() === normalized.toLowerCase();
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

  public resolveRoute = (
    path: string,
    options?: { runMiddlewares?: boolean },
  ): ResolvedRouteInfo<TMeta> | null => {
    let url: URL;
    try {
      url = this.resolveTo(path);
    } catch {
      return null;
    }

    const { pathname, searchParams } = parseUrl(url);

    if (options?.runMiddlewares) {
      const globalResult = this.runMiddlewares(this.middlewares, {
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
        const routeResult = this.runMiddlewares(route.middlewares, {
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
        meta: route.meta as TMeta | undefined,
        component: route.component,
        params: match,
        pattern: route.pattern,
        searchParams: queryResult.searchParams,
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

    if (!['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol))
      throw new Error(
        `BaseRouter.navigateExternal: unsafe protocol "${parsed.protocol}"`,
      );

    if (parsed.origin === window.location.origin) {
      const internalPath =
        stripBase(parsed.pathname, this.base) + parsed.search + parsed.hash;
      this.navigate(internalPath);
      return;
    }

    if (options?.target === '_blank')
      window.open(url, '_blank', 'noopener,noreferrer');
    else window.location.href = url;
  };

  public createHref = (path: string): string => {
    const url = this.resolveTo(path);
    return (
      addBase(normalizePath(url.pathname), this.base) + url.search + url.hash
    );
  };
}

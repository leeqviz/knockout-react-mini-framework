import { ko } from '@/shared/lib/ko';
import type {
  AfterNavigateHook,
  BeforeNavigateHook,
  BlockerState,
  MetaTagsResolver,
  NavigateExternalOptions,
  NavigateOptions,
  NavigationBlockedHook,
  NavigationErrorHook,
  NavigationLocation,
  NavigationNotFoundHook,
  ParsedURL,
  ResolvedRoute,
  RouteConfig,
  RouteMiddleware,
  RouteParams,
  RouteResolutionResult,
  RouterNavigationType,
  RouterOptions,
  RouterSnapshot,
  RouteSearchParams,
  RouteState,
  ScrollBehaviorMeta,
  ScrollBehaviorOptions,
  TitleResolver,
} from './types';
import {
  addBase,
  AllowedURLProtocols,
  applyQueryParamConfig,
  buildPath,
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
  protected readonly base: string;
  protected readonly routes: RouteConfig<TMeta>[];
  protected readonly middlewares: RouteMiddleware<TMeta>[];

  protected readonly scrollBehavior: (
    meta?: ScrollBehaviorMeta<TMeta> | undefined,
  ) => ScrollBehaviorOptions | null;
  protected readonly stateCompare: (a: unknown, b: unknown) => boolean;

  protected readonly beforeNavigateHook: BeforeNavigateHook<TMeta> | undefined;
  protected readonly afterNavigateHook: AfterNavigateHook<TMeta> | undefined;
  protected readonly onNavigationBlockedHook:
    | NavigationBlockedHook<TMeta>
    | undefined;
  protected readonly onNavigationErrorHook: NavigationErrorHook | undefined;
  protected readonly onNavigationNotFoundHook:
    | NavigationNotFoundHook
    | undefined;
  protected readonly confirmLeaveHook:
    | ((to: NavigationLocation, from: RouteState<TMeta> | null) => boolean)
    | undefined;

  protected readonly titleResolver: TitleResolver<TMeta> | undefined;
  protected readonly metaTagsResolver: MetaTagsResolver<TMeta> | undefined;

  protected readonly caseSensitive: boolean;
  protected readonly debug: boolean;
  protected readonly enableBeforeUnload: boolean;
  protected readonly maxScrollEntries: number;
  protected readonly maxRewriteDepth: number;
  protected readonly fallback: string;

  protected scrollOptions = new Map<string, ScrollBehaviorOptions | null>();
  protected currentHistoryKey: string = '';
  protected previousRouteState: RouteState<TMeta> | null = null;
  protected isStarted: boolean = false;
  protected blockers = new Map<
    string,
    (to: NavigationLocation, from: RouteState<TMeta> | null) => boolean
  >();
  protected pendingProceed: (() => void) | null = null;
  protected currentMask: string | undefined;

  public component: KnockoutObservable<string>;
  public params: KnockoutObservable<RouteParams>;
  public searchParams: KnockoutObservable<RouteSearchParams>;

  public locationPathname: KnockoutObservable<string>;
  public locationSearch: KnockoutObservable<string>;
  public locationState: KnockoutObservable<unknown>;
  public locationHash: KnockoutObservable<string>;

  public routeName: KnockoutObservable<string | undefined>;
  public routeMeta: KnockoutObservable<TMeta | undefined>;
  public routePattern: KnockoutObservable<string | undefined>;

  public navigationType: KnockoutObservable<RouterNavigationType>;
  public isPending: KnockoutObservable<boolean>;
  public pendingLocation: KnockoutObservable<NavigationLocation | null>;
  public blockerState: KnockoutObservable<BlockerState>;
  public blockedLocation: KnockoutObservable<NavigationLocation | null>;

  public snapshot: KnockoutComputed<RouterSnapshot<TMeta>>;

  protected constructor(options?: RouterOptions<TMeta>) {
    this.routes = rankRoutes(options?.routes ?? []);
    this.base = normalizeBase(options?.base ?? '');
    this.debug = options?.debug ?? false;
    this.caseSensitive = options?.caseSensitive ?? false;
    this.maxScrollEntries = options?.maxScrollEntries ?? 50;
    this.maxRewriteDepth = options?.maxRewriteDepth ?? 10;
    this.middlewares = options?.middlewares || [];
    this.scrollBehavior = options?.scrollBehavior ?? defaultScrollBehavior;
    this.stateCompare = resolveComparator(options?.stateCompare);
    this.titleResolver = options?.titleResolver;
    this.metaTagsResolver = options?.metaTagsResolver;
    this.beforeNavigateHook = options?.beforeNavigate;
    this.afterNavigateHook = options?.afterNavigate;
    this.onNavigationBlockedHook = options?.onNavigationBlocked;
    this.onNavigationErrorHook = options?.onNavigationError;
    this.confirmLeaveHook = options?.confirmLeave;
    this.enableBeforeUnload = options?.confirmLeave
      ? (options?.enableBeforeUnload ?? true)
      : false;
    this.fallback = options?.fallback ?? '';
    this.onNavigationNotFoundHook = options?.onNavigationNotFound;

    const initialUrl = new URL(window.location.href);
    const strippedPathname = normalizePath(
      stripBase(initialUrl.pathname, this.base),
    );
    let initialParams: RouteParams = {};
    const initialMatch = this.routes.find((r) => {
      const match = matchRoute(r.pattern, strippedPathname, this.caseSensitive);
      if (match) {
        initialParams = match;
        return true;
      }
      return false;
    });

    this.component = ko.observable(initialMatch?.component ?? this.fallback);
    this.params = ko.observable(initialParams);
    this.searchParams = ko.observable(parseUrl(initialUrl).searchParams);

    this.routeName = ko.observable(initialMatch?.name);
    this.routeMeta = ko.observable(initialMatch?.meta);
    this.routePattern = ko.observable(initialMatch?.pattern);

    this.locationPathname = ko.observable(strippedPathname);
    this.locationSearch = ko.observable(initialUrl.search);
    this.locationHash = ko.observable(initialUrl.hash);
    this.locationState = ko.observable(
      readHistoryState(window.history.state).data,
    );

    this.isPending = ko.observable(false);
    this.pendingLocation = ko.observable(null);
    this.navigationType = ko.observable<RouterNavigationType>('pop');
    this.blockerState = ko.observable<BlockerState>('unblocked');
    this.blockedLocation = ko.observable(null);
    this.snapshot = ko.pureComputed(() => this.getSnapshot());
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
        this.notifyBeforeNavigate({
          pathname: nextState.pathname,
          search: nextState.search,
          hash: nextState.hash,
          state: userState,
        });
        this.applyState(nextState);
        this.notifyAfterNavigate(nextState);
        this.handleScroll({
          to: nextState,
          from: this.previousRouteState,
          options: null,
        });
      },
      onNotFound: () => {
        this.notifyNavigationNotFound({
          pathname: originalUrl.pathname,
          search: originalUrl.search,
          hash: originalUrl.hash,
          state: userState,
        });
        const s = this.buildNotFoundState(
          originalUrl.pathname,
          originalUrl.search,
          initialHash,
          userState,
        );
        if (s) this.applyState(s);
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

    this.isPending(false);
    this.pendingLocation(null);
    this.blockerState('unblocked');
    this.blockedLocation(null);
    this.pendingProceed = null;
    this.currentMask = undefined;
    this.blockers.clear();
    this.snapshot.dispose();
  };

  protected handleBeforeUnload = (event: BeforeUnloadEvent): void => {
    if (!this.confirmLeaveHook) return;

    if (
      !this.confirmLeaveHook(
        {
          pathname: '',
          search: '',
          hash: '',
          state: null,
        },
        this.currentRouteState(),
      )
    ) {
      event.preventDefault();
      event.returnValue = '';
    }
  };

  public navigate = (
    path: string,
    options?: NavigateOptions | undefined,
  ): void => {
    const nextUrl = resolveTo(
      path,
      this.locationPathname(),
      this.locationSearch(),
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
    const sameHash = this.locationHash() === nextHash;

    if (
      !options?.force &&
      samePath &&
      sameState &&
      sameHash &&
      !options?.rewriteTo
    )
      return;

    if (this.confirmLeaveHook && !samePath) {
      const to: NavigationLocation = {
        pathname: normalizePath(nextUrl.pathname),
        search: nextUrl.search,
        hash: nextHash,
        state: options?.state ?? null,
      };
      if (!this.confirmLeaveHook(to, this.currentRouteState())) return;
    }

    if (this.blockers.size > 0 && this.blockerState() !== 'proceeding') {
      const to: NavigationLocation = {
        pathname: normalizePath(nextUrl.pathname),
        search: nextUrl.search,
        hash: nextHash,
        state: nextState,
      };
      const from = this.currentRouteState();
      const shouldBlock = [...this.blockers.values()].some((fn) =>
        fn(to, from),
      );
      if (shouldBlock) {
        this.blockerState('blocked');
        this.blockedLocation(to);
        this.pendingProceed = () => this.navigate(path, options);
        return;
      }
    }

    if (options?.rewriteTo) {
      const actualUrl = resolveTo(
        options.rewriteTo,
        this.locationPathname(),
        this.locationSearch(),
      );
      const actualFullPath =
        normalizePath(actualUrl.pathname) + actualUrl.search;
      const actualResult = this.resolvePath(actualFullPath, nextState);

      handleResolveResult(actualResult, {
        onResolved: (res) => {
          const maskedState: RouteState<TMeta> = {
            pathname: normalizePath(nextUrl.pathname),
            search: nextUrl.search,
            searchParams: parseUrl(nextUrl).searchParams,
            hash: nextHash,
            component: res.value.component,
            params: res.value.params,
            name: res.value.name,
            meta: res.value.meta,
            pattern: res.value.pattern,
            state: nextState,
          };

          const visiblePath =
            addBase(
              normalizePath(nextUrl.pathname) + nextUrl.search,
              this.base,
            ) + nextHash;

          this.notifyBeforeNavigate({
            pathname: maskedState.pathname,
            search: maskedState.search,
            hash: nextHash,
            state: nextState,
          });
          this.pushOrReplace(
            visiblePath,
            nextState,
            options.replace,
            options.rewriteTo,
          );
          this.applyState(maskedState);
          this.notifyAfterNavigate(maskedState);
          this.handleScroll({
            to: maskedState,
            from: this.previousRouteState,
            options: null,
          });
        },
        onNotFound: () => {
          const error = new Error(
            `navigate mask: no route matches "${options.rewriteTo}"`,
          );
          const handled = this.notifyNavigationError(error, {
            pathname: normalizePath(nextUrl.pathname),
            search: nextUrl.search,
            hash: nextHash,
            state: nextState,
          });
          if (!handled) throw error;
        },
        onRedirect: (res) => {
          this.navigate(nextUrl.pathname + nextUrl.search + nextHash, {
            ...options,
            rewriteTo: res.to,
          });
        },
        onBlocked: () => {
          this.notifyNavigationBlocked({
            pathname: normalizePath(nextUrl.pathname),
            search: nextUrl.search,
            hash: nextHash,
            state: nextState,
          });
        },
        onRewrite: (res) => {
          const visibleOriginalUrl = parseUrl(
            new URL(
              normalizePath(nextUrl.pathname) + nextUrl.search + nextHash,
              window.location.origin,
            ),
          );
          this.resolveRewrite(visibleOriginalUrl, res.to, nextState);
        },
        onError: (res) => {
          const handled = this.notifyNavigationError(res.error, {
            pathname: normalizePath(nextUrl.pathname),
            search: nextUrl.search,
            hash: nextHash,
            state: nextState,
          });
          if (!handled) throw res.error;
        },
      });
      return;
    }

    if (samePath && sameState && !sameHash) {
      const fullUrlWithHash = addBase(currentFullPath, this.base) + nextHash;

      this.notifyBeforeNavigate({
        pathname: normalizePath(nextUrl.pathname),
        search: nextUrl.search,
        hash: nextHash,
        state: options?.state ?? null,
      });
      this.pushOrReplace(fullUrlWithHash, nextState, options?.replace);

      this.locationHash(nextHash);
      this.locationState(nextState);
      this.notifyAfterNavigate(this.currentRouteState());
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
        const nextRouteState = { ...res.value, hash: nextHash };
        this.notifyBeforeNavigate({
          pathname: nextRouteState.pathname,
          search: nextRouteState.search,
          hash: nextRouteState.hash,
          state: nextState,
        });
        const normalizedPath =
          addBase(res.value.pathname + res.value.search, this.base) + nextHash;

        this.pushOrReplace(normalizedPath, nextState, options?.replace);

        this.applyState(nextRouteState);
        this.notifyAfterNavigate(nextRouteState);
        this.handleScroll({
          to: nextRouteState,
          from: this.previousRouteState,
          options: null,
        });
      },
      onNotFound: () => {
        const to: NavigationLocation = {
          pathname: originalUrl.pathname,
          search: originalUrl.search,
          hash: nextHash,
          state: nextState,
        };
        this.notifyNavigationNotFound(to);
        const s = this.buildNotFoundState(
          originalUrl.pathname,
          originalUrl.search,
          nextHash,
          nextState,
        );
        if (s) {
          this.notifyBeforeNavigate(to);
          this.pushOrReplace(
            addBase(originalUrl.pathname + originalUrl.search, this.base) +
              nextHash,
            nextState,
            options?.replace,
          );
          this.applyState(s);
          this.notifyAfterNavigate(s);
          this.handleScroll({
            to: s,
            from: this.previousRouteState,
            options: null,
          });
        }
      },
    });
  };

  protected pushOrReplace = (
    path: string,
    state: unknown,
    replace?: boolean,
    mask?: string,
  ): void => {
    this.currentMask = mask;
    if (replace) {
      this.navigationType('replace');
      window.history.replaceState(
        wrapHistoryState(state, this.currentHistoryKey, mask),
        '',
        path,
      );
    } else {
      this.saveCurrentScrollPosition();
      const key = generateHistoryStateKey();
      this.currentHistoryKey = key;
      this.navigationType('push');
      window.history.pushState(wrapHistoryState(state, key, mask), '', path);
    }
  };

  public getSnapshot = (): RouterSnapshot<TMeta> => {
    return {
      params: this.params(),
      searchParams: this.searchParams(),
      searchParamsAPI: {
        setSearchParam: this.setSearchParam,
        appendSearchParam: this.appendSearchParam,
        deleteSearchParam: this.deleteSearchParam,
        patchSearchParams: this.patchSearchParams,
        replaceAllSearchParams: this.replaceAllSearchParams,
        getSearchParam: this.getSearchParam,
        getAllSearchParams: this.getAllSearchParams,
        hasSearchParam: this.hasSearchParam,
      },
      location: {
        pathname: this.locationPathname(),
        hash: this.locationHash(),
        search: this.locationSearch(),
        state: this.locationState(),
      },
      locationAPI: {
        navigate: this.navigate,
        navigateExternal: this.navigateExternal,
        back: this.back,
        forward: this.forward,
        go: this.go,
        pendingLocation: this.pendingLocation(),
        isPending: this.isPending(),
        navigationType: this.navigationType(),
        blockerState: this.blockerState(),
        blockedLocation: this.blockedLocation(),
        setBlocker: this.setBlocker,
        proceedBlocked: this.proceedBlocked,
        resetBlocked: this.resetBlocked,
      },
      route: {
        name: this.routeName(),
        meta: this.routeMeta(),
        pattern: this.routePattern(),
      },
      routeAPI: {
        generatePath: this.generatePath,
        createHref: this.createHref,
        hasRoute: this.hasRoute,
        resolveRoute: this.resolveRoute,
        isActive: this.isActive,
        isExact: this.isExact,
      },
    };
  };

  protected handlePopState = (): void => {
    this.saveCurrentScrollPosition();

    const previousFullPath = this.locationPathname() + this.locationSearch();
    const previousHash = this.locationHash();
    const previousState = this.locationState();
    const previousHistoryKey = this.currentHistoryKey;
    const previousMask = this.currentMask;

    const nextFullPath = getFullPath(this.base);
    const nextHash = window.location.hash;
    const {
      key: nextKey,
      data: nextUserState,
      mask,
    } = readHistoryState(window.history.state);

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
      if (!this.confirmLeaveHook(to, this.currentRouteState())) {
        this.currentHistoryKey = previousHistoryKey;
        window.history.replaceState(
          wrapHistoryState(previousState, previousHistoryKey, previousMask),
          '',
          addBase(previousFullPath, this.base) + previousHash,
        );
        this.notifyNavigationBlocked(to);
        return;
      }
    }

    if (samePath) {
      this.navigationType('pop');
      this.locationHash(nextHash);
      this.locationState(nextUserState);
      this.notifyAfterNavigate(this.currentRouteState());
      scrollToFragment(nextHash, null);
      return;
    }

    const originalUrl = parseUrl(
      new URL(nextFullPath + nextHash, window.location.origin),
    );

    if (this.blockers.size > 0 && this.blockerState() !== 'proceeding') {
      const to: NavigationLocation = {
        pathname: originalUrl.pathname,
        search: originalUrl.search,
        hash: nextHash,
        state: nextUserState,
      };
      const from = this.currentRouteState();
      const shouldBlock = [...this.blockers.values()].some((fn) =>
        fn(to, from),
      );
      if (shouldBlock) {
        this.rollbackHistory(
          previousHistoryKey,
          previousState,
          previousFullPath,
          previousHash,
          previousMask,
        );
        this.blockerState('blocked');
        this.blockedLocation(to);
        this.notifyNavigationBlocked(to);
        this.pendingProceed = () =>
          this.navigate(to.pathname + to.search + to.hash, {
            state: nextUserState,
            ...(mask ? { rewriteTo: mask } : {}),
          });
        return;
      }
    }

    if (mask) {
      const maskedUrl = resolveTo(mask, '/', '');
      const maskedFullPath =
        normalizePath(maskedUrl.pathname) + maskedUrl.search;
      const result = this.resolvePath(maskedFullPath, nextUserState);

      handleResolveResult(result, {
        onResolved: (res) => {
          const maskedState: RouteState<TMeta> = {
            pathname: originalUrl.pathname,
            search: originalUrl.search,
            searchParams: originalUrl.searchParams,
            hash: nextHash,
            component: res.value.component,
            params: res.value.params,
            name: res.value.name,
            meta: res.value.meta,
            pattern: res.value.pattern,
            state: nextUserState,
          };
          this.navigationType('pop');
          this.notifyBeforeNavigate({
            pathname: maskedState.pathname,
            search: maskedState.search,
            hash: nextHash,
            state: nextUserState,
          });
          this.applyState(maskedState);
          this.notifyAfterNavigate(maskedState);
          this.handleScroll({
            to: maskedState,
            from: this.previousRouteState,
            options: savedScrollOption,
          });
        },
        onNotFound: () => {
          const fallbackResult = this.resolvePath(nextFullPath, nextUserState);
          handleResolveResult(fallbackResult, {
            onResolved: (res) => {
              this.navigationType('pop');
              const nextRouteState = { ...res.value, hash: nextHash };
              this.notifyBeforeNavigate({
                pathname: nextRouteState.pathname,
                search: nextRouteState.search,
                hash: nextHash,
                state: nextUserState,
              });
              this.applyState(nextRouteState);
              this.notifyAfterNavigate(nextRouteState);
              this.handleScroll({
                to: nextRouteState,
                from: this.previousRouteState,
                options: savedScrollOption,
              });
            },
            onNotFound: () => {
              this.notifyNavigationNotFound({
                pathname: originalUrl.pathname,
                search: originalUrl.search,
                hash: nextHash,
                state: nextUserState,
              });
              const s = this.buildNotFoundState(
                originalUrl.pathname,
                originalUrl.search,
                nextHash,
                nextUserState,
              );
              if (s) {
                this.navigationType('pop');
                this.notifyBeforeNavigate({
                  pathname: originalUrl.pathname,
                  search: originalUrl.search,
                  hash: nextHash,
                  state: nextUserState,
                });
                this.applyState(s);
                this.notifyAfterNavigate(s);
                this.handleScroll({
                  to: s,
                  from: this.previousRouteState,
                  options: savedScrollOption,
                });
              } else
                this.rollbackHistory(
                  previousHistoryKey,
                  previousState,
                  previousFullPath,
                  previousHash,
                  previousMask,
                );
            },
            onRedirect: (res) => {
              this.navigate(res.to, { replace: true, state: null });
            },
            onRewrite: (res) => {
              this.resolveRewrite(
                originalUrl,
                res.to,
                nextUserState,
                savedScrollOption,
              );
            },
            onBlocked: () => {
              this.rollbackHistory(
                previousHistoryKey,
                previousState,
                previousFullPath,
                previousHash,
                previousMask,
              );
              this.notifyNavigationBlocked({
                pathname: originalUrl.pathname,
                search: originalUrl.search,
                hash: nextHash,
                state: nextUserState,
              });
            },
            onError: (res) => {
              if (
                !this.notifyNavigationError(res.error, {
                  pathname: originalUrl.pathname,
                  search: originalUrl.search,
                  hash: nextHash,
                  state: nextUserState,
                })
              )
                throw res.error;
            },
          });
        },
        onBlocked: () => {
          this.rollbackHistory(
            previousHistoryKey,
            previousState,
            previousFullPath,
            previousHash,
            previousMask,
          );
          this.notifyNavigationBlocked({
            pathname: originalUrl.pathname,
            search: originalUrl.search,
            hash: nextHash,
            state: nextUserState,
          });
        },
        onRedirect: (res) => {
          this.navigate(res.to, { replace: true, state: null });
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
          if (
            !this.notifyNavigationError(res.error, {
              pathname: originalUrl.pathname,
              search: originalUrl.search,
              hash: nextHash,
              state: nextUserState,
            })
          )
            throw res.error;
        },
      });
      return;
    }

    const result = this.resolvePath(nextFullPath, nextUserState);

    handleResolveResult(result, {
      onBlocked: () => {
        this.rollbackHistory(
          previousHistoryKey,
          previousState,
          previousFullPath,
          previousHash,
          previousMask,
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
            previousMask,
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
        this.navigationType('pop');

        const nextRouteState = { ...res.value, hash: nextHash };
        this.notifyBeforeNavigate({
          pathname: nextRouteState.pathname,
          search: nextRouteState.search,
          hash: nextRouteState.hash,
          state: nextUserState,
        });
        this.applyState(nextRouteState);
        this.notifyAfterNavigate(nextRouteState);
        this.handleScroll({
          to: nextRouteState,
          from: this.previousRouteState,
          options: savedScrollOption,
        });
      },
      onNotFound: () => {
        const to: NavigationLocation = {
          pathname: originalUrl.pathname,
          search: originalUrl.search,
          hash: nextHash,
          state: nextUserState,
        };
        this.notifyNavigationNotFound(to);
        const s = this.buildNotFoundState(
          originalUrl.pathname,
          originalUrl.search,
          nextHash,
          nextUserState,
        );
        if (s) {
          this.navigationType('pop');
          this.notifyBeforeNavigate(to);
          this.applyState(s);
          this.notifyAfterNavigate(s);
          this.handleScroll({
            to: s,
            from: this.previousRouteState,
            options: savedScrollOption,
          });
        } else {
          this.rollbackHistory(
            previousHistoryKey,
            previousState,
            previousFullPath,
            previousHash,
            previousMask,
          );
        }
      },
    });
  };

  protected rollbackHistory = (
    key: string,
    state: unknown,
    fullPath: string,
    hash: string,
    mask?: string,
  ): void => {
    this.currentHistoryKey = key;
    this.currentMask = mask;
    window.history.replaceState(
      wrapHistoryState(state, key, mask),
      '',
      addBase(fullPath, this.base) + hash,
    );
  };

  protected resolveRewrite = (
    originalUrl: ParsedURL,
    rewriteTo: string,
    state: unknown,
    scrollOptions: ScrollBehaviorOptions | null = null,
    depth: number = 0,
  ): void => {
    if (depth > this.maxRewriteDepth)
      throw new Error(
        `Maximum rewrite depth (${this.maxRewriteDepth}) exceeded at "${rewriteTo}"`,
      );

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
        this.notifyBeforeNavigate({
          pathname: nextRouteState.pathname,
          search: nextRouteState.search,
          hash: nextRouteState.hash,
          state,
        });
        this.applyState(nextRouteState);
        this.notifyAfterNavigate(nextRouteState);
        this.handleScroll({
          to: nextRouteState,
          from: this.previousRouteState,
          options: scrollOptions,
        });
      },
      onNotFound: () => {
        const error = new Error(
          `resolveRewrite: no route matches "${rewriteTo}"`,
        );
        const handled = this.notifyNavigationError(error, {
          pathname: originalUrl.pathname,
          search: originalUrl.search,
          hash: originalUrl.hash,
          state,
        });
        if (!handled) throw error;
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
      type: ResolveResultType.NotFound,
    };
  };

  protected applyState = (nextState: RouteState<TMeta>): void => {
    this.previousRouteState = this.currentRouteState();

    this.locationPathname(nextState.pathname);
    this.locationSearch(nextState.search);
    this.locationHash(nextState.hash);
    this.locationState(nextState.state);

    this.component(nextState.component);
    this.params(nextState.params);
    this.searchParams(nextState.searchParams);

    this.routeName(nextState.name);
    this.routeMeta(nextState.meta);
    this.routePattern(nextState.pattern);
  };

  protected saveCurrentScrollPosition = (): void => {
    if (!this.currentHistoryKey) return;
    this.scrollOptions.set(this.currentHistoryKey, {
      top: window.scrollY,
      left: window.scrollX,
      behavior: 'auto',
    });

    if (this.scrollOptions.size > this.maxScrollEntries) {
      const firstKey = this.scrollOptions.keys().next().value;
      if (firstKey) this.scrollOptions.delete(firstKey);
    }
  };

  protected currentRouteState = (): RouteState<TMeta> => ({
    pathname: this.locationPathname(),
    search: this.locationSearch(),
    hash: this.locationHash(),
    component: this.component(),
    params: this.params(),
    searchParams: this.searchParams(),
    state: this.locationState(),
    name: this.routeName(),
    meta: this.routeMeta(),
    pattern: this.routePattern(),
  });

  protected handleScroll = (meta: ScrollBehaviorMeta<TMeta>): void => {
    if (meta.to?.hash) scrollToFragment(meta.to.hash, meta.options);
    else scrollToTarget(this.scrollBehavior(meta));
  };

  protected getCurrentSearchInstance = (): URLSearchParams => {
    return new URLSearchParams(this.locationSearch());
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
      this.locationPathname() +
      (search.toString() ? `?${search.toString()}` : '') +
      this.locationHash()
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
      state: options?.state ?? this.locationState(),
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
      else {
        if (value !== null && value !== undefined) search.set(key, value);
      }
    });

    this.navigate(this.buildUrlWithSearch(search), {
      replace: options?.replace ?? true,
      state: options?.state ?? this.locationState(),
    });
  };

  public generatePath = (
    name: string,
    params?: RouteParams,
    searchParams?: RouteSearchParams | URLSearchParams,
    hash?: string,
  ): string => {
    const route = this.routes.find((r) => r.name === name);
    if (!route) throw new Error(`Route "${name}" not found`);

    if (route.paramValidators && params) {
      if (!validateParams(params, route.paramValidators)) {
        throw new Error(
          `generatePath("${name}"): invalid params — ` +
            `param validation failed for: ${Object.keys(route.paramValidators).join(', ')}`,
        );
      }
    }

    return buildPath(route, params, searchParams, hash);
  };

  protected notifyBeforeNavigate = (to: NavigationLocation): void => {
    this.isPending(true);
    this.pendingLocation(to);
    this.beforeNavigateHook?.(to, this.currentRouteState());
  };

  protected notifyAfterNavigate = (to: RouteState<TMeta>): void => {
    this.applyDocumentMeta(to);
    this.afterNavigateHook?.(to, this.previousRouteState);
    this.isPending(false);
    this.pendingLocation(null);
  };

  protected notifyNavigationBlocked = (to: NavigationLocation): void => {
    this.onNavigationBlockedHook?.(to, this.currentRouteState());
  };

  protected notifyNavigationError = (
    error: unknown,
    to: NavigationLocation,
  ): boolean => {
    return this.onNavigationErrorHook?.(error, to) === true;
  };

  protected notifyNavigationNotFound = (to: NavigationLocation): void => {
    this.onNavigationNotFoundHook?.(to);
  };

  protected buildNotFoundState = (
    pathname: string,
    search: string,
    hash: string,
    state: unknown,
  ): RouteState<TMeta> | null => {
    if (!this.fallback) return null;
    return {
      pathname,
      search,
      hash,
      component: this.fallback,
      params: {},
      searchParams: {},
      state,
      name: undefined,
      meta: undefined,
      pattern: undefined,
    };
  };

  public isActive = (path: string): boolean => {
    const url = resolveTo(path, this.locationPathname(), this.locationSearch());
    const target = parseUrl(url);
    const targetPath = sanitizePath(target.pathname);
    const currentPath = sanitizePath(this.locationPathname());

    const compare = (a: string, b: string) =>
      this.caseSensitive ? a === b : a.toLowerCase() === b.toLowerCase();

    const pathnameMatch =
      compare(currentPath, targetPath) ||
      (this.caseSensitive
        ? currentPath.startsWith(targetPath + '/')
        : currentPath.toLowerCase().startsWith(targetPath.toLowerCase() + '/'));

    if (!pathnameMatch) return false;

    if (target.search) {
      const targetParams = new URLSearchParams(target.search);
      const currentParams = new URLSearchParams(this.locationSearch());
      for (const [key, value] of targetParams) {
        if (currentParams.get(key) !== value) return false;
      }
    }

    if (target.hash) {
      if (this.locationHash() !== target.hash) return false;
    }

    return true;
  };

  public isExact = (path: string): boolean => {
    const url = resolveTo(path, this.locationPathname(), this.locationSearch());
    const target = parseUrl(url);

    const pathnameMatch = this.caseSensitive
      ? sanitizePath(this.locationPathname()) === sanitizePath(target.pathname)
      : sanitizePath(this.locationPathname()).toLowerCase() ===
        sanitizePath(target.pathname).toLowerCase();

    if (!pathnameMatch) return false;

    const a = new URLSearchParams(this.locationSearch());
    const b = new URLSearchParams(target.search);
    if ([...a].length !== [...b].length) return false;
    for (const [key, value] of b) {
      if (a.get(key) !== value) return false;
    }

    if (this.locationHash() !== target.hash) return false;

    return true;
  };

  public back = (fallback: string | undefined = '/'): void => {
    if (window.history.length <= 1 && fallback) {
      this.navigate(fallback, { replace: true });
    } else {
      window.history.back();
    }
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
    options?: { skipMiddlewares?: boolean },
  ): ResolvedRoute<TMeta> | null => {
    let url: URL;
    try {
      url = resolveTo(path, this.locationPathname(), this.locationSearch());
    } catch {
      return null;
    }

    const { pathname, searchParams } = parseUrl(url);

    if (!options?.skipMiddlewares) {
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

      if (!options?.skipMiddlewares && route.middlewares?.length) {
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
    const url = resolveTo(path, this.locationPathname(), this.locationSearch());
    const { pathname } = parseUrl(url);

    const matched = this.routes.some((r) =>
      matchRoute(r.pattern, pathname, this.caseSensitive),
    );
    if (!matched) {
      throw new Error(`createHref: no route matches "${pathname}".`);
    }

    return (
      addBase(normalizePath(url.pathname), this.base) + url.search + url.hash
    );
  };

  protected applyDocumentMeta = (state: RouteState<TMeta>): void => {
    const resolvedTitle = this.titleResolver?.(state);
    if (resolvedTitle !== undefined) {
      document.title = resolvedTitle;
    } else if (state.name) {
      const route = this.routes.find((r) => r.name === state.name);
      if (route?.title) document.title = route.title;
    }

    const tags = this.metaTagsResolver?.(state);
    if (!tags) return;
    for (const [name, content] of Object.entries(tags)) {
      let el = document.querySelector<HTMLMetaElement>(
        `meta[name="${CSS.escape(name)}"]`,
      );
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    }
  };

  public setBlocker = (
    id: string,
    fn:
      | ((to: NavigationLocation, from: RouteState<TMeta> | null) => boolean)
      | null,
  ): void => {
    if (fn === null) {
      this.blockers.delete(id);
      if (this.blockers.size === 0) {
        this.blockerState('unblocked');
        this.blockedLocation(null);
        this.pendingProceed = null;
      }
    } else {
      this.blockers.set(id, fn);
    }
  };

  public proceedBlocked = (): void => {
    if (this.blockerState() !== 'blocked' || !this.pendingProceed) return;
    this.blockerState('proceeding');
    const proceed = this.pendingProceed;
    this.pendingProceed = null;
    this.blockedLocation(null);
    proceed();
    if (this.blockerState() === 'proceeding') this.blockerState('unblocked');
  };

  public resetBlocked = (): void => {
    if (this.blockerState() === 'unblocked') return;
    this.blockerState('unblocked');
    this.blockedLocation(null);
    this.pendingProceed = null;
  };
}

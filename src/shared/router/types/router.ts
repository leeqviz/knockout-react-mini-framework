import type { RouteMiddleware } from './middleware';
import type {
  RouteConfig,
  RouteParams,
  RouteSearchParams,
  RouteState,
} from './route';

export type StateCompareStrategy =
  | 'reference' // by default
  | 'shallow' // Object.keys + ===
  | 'deep' // recursive Object.is
  | ((a: unknown, b: unknown) => boolean); // custom

export type ScrollBehaviorOptions =
  | ScrollToOptions
  | ScrollIntoViewOptions
  | boolean;

export interface ScrollBehaviorMeta<
  TMeta extends Record<string, unknown> = Record<string, unknown>,
> {
  to: RouteState<TMeta> | null;
  from: RouteState<TMeta> | null;
  options: ScrollBehaviorOptions | null;
}

export type ScrollBehaviorStrategy<
  TMeta extends Record<string, unknown> = Record<string, unknown>,
> = (
  meta?: ScrollBehaviorMeta<TMeta> | undefined,
) => ScrollBehaviorOptions | null;

export type TitleResolver<
  TMeta extends Record<string, unknown> = Record<string, unknown>,
> = (state: RouteState<TMeta>) => string | undefined;

export type MetaTagsResolver<
  TMeta extends Record<string, unknown> = Record<string, unknown>,
> = (state: RouteState<TMeta>) => Record<string, string> | undefined;

export type RouterNavigationType = 'push' | 'pop' | 'replace';
export type BlockerState = 'unblocked' | 'blocked' | 'proceeding';
export type BlockerFunction<TMeta extends Record<string, unknown>> = (
  to: NavigationLocation,
  from: RouteState<TMeta> | null,
) => boolean;

export interface NavigationLocation {
  pathname: string;
  search: string;
  hash: string;
  state: unknown;
}

export type BeforeNavigateHook<
  TMeta extends Record<string, unknown> = Record<string, unknown>,
> = (to: NavigationLocation, from: RouteState<TMeta> | null) => void;

export type AfterNavigateHook<
  TMeta extends Record<string, unknown> = Record<string, unknown>,
> = (to: RouteState<TMeta>, from: RouteState<TMeta> | null) => void;

export type NavigationBlockedHook<
  TMeta extends Record<string, unknown> = Record<string, unknown>,
> = (to: NavigationLocation, from: RouteState<TMeta> | null) => void;

export type NavigationErrorHook = (
  error: unknown,
  to: NavigationLocation,
) => boolean | void;

export type NavigationNotFoundHook = (to: NavigationLocation) => void;

export interface RouterOptions<
  TMeta extends Record<string, unknown> = Record<string, unknown>,
> {
  routes?: RouteConfig<TMeta>[] | undefined;
  middlewares?: RouteMiddleware<TMeta>[] | undefined;
  scrollBehavior?: ScrollBehaviorStrategy<TMeta>;
  stateCompare?: StateCompareStrategy;
  titleResolver?: TitleResolver<TMeta>;
  metaTagsResolver?: MetaTagsResolver<TMeta>;
  beforeNavigate?: BeforeNavigateHook<TMeta>;
  afterNavigate?: AfterNavigateHook<TMeta>;
  onNavigationBlocked?: NavigationBlockedHook<TMeta>;
  onNavigationError?: NavigationErrorHook;
  onNavigationNotFound?: NavigationNotFoundHook;
  fallback?: string;
  debug?: boolean;
  base?: string;
  caseSensitive?: boolean;
  confirmLeave?: (
    to: NavigationLocation,
    from: RouteState<TMeta> | null,
  ) => boolean;
  enableBeforeUnload?: boolean;

  maxScrollEntries?: number; // default: 50
  maxRewriteDepth?: number; // default: 10
}

export interface NavigateOptions {
  replace?: boolean | undefined;
  state?: unknown;
  stateCompare?: StateCompareStrategy;
  force?: boolean;
  rewriteTo?: string | undefined;
}

export interface NavigateExternalOptions {
  target?: '_blank' | '_self' | '_parent' | '_top' | (string & {}) | undefined; // default: '_self'
  allowAnyProtocol?: boolean;
}

export interface ResolvedRoute<
  TMeta extends Record<string, unknown> = Record<string, unknown>,
> {
  name: string | undefined;
  meta: TMeta | undefined;
  component: string;
  params: RouteParams;
  pattern: string;
  searchParams: RouteSearchParams;
}

export interface RouterSnapshot<
  TMeta extends Record<string, unknown> = Record<string, unknown>,
> {
  params: RouteParams;
  searchParams: RouteSearchParams;
  searchParamsAPI: {
    getSearchParam: (key: string) => string | null;
    getAllSearchParams: (key: string) => string[];
    hasSearchParam: (key: string) => boolean;
    setSearchParam: (
      key: string,
      value: string,
      options?: NavigateOptions,
    ) => void;
    appendSearchParam: (
      key: string,
      value: string,
      options?: NavigateOptions,
    ) => void;
    deleteSearchParam: (
      key: string,
      value?: string,
      options?: NavigateOptions,
    ) => void;
    patchSearchParams: (
      patch: Record<string, string | string[] | null | undefined>,
      options?: NavigateOptions,
    ) => void;
    replaceAllSearchParams: (
      searchParams: RouteSearchParams,
      options?: NavigateOptions,
    ) => void;
  };
  location: NavigationLocation;
  locationAPI: {
    pendingLocation: NavigationLocation | null;
    navigationType: RouterNavigationType;
    isPending: boolean;
    navigate: (path: string, options?: NavigateOptions) => void;
    navigateExternal: (path: string, options?: NavigateExternalOptions) => void;
    back: (fallback?: string | undefined) => void;
    forward: () => void;
    go: (delta: number) => void;
    blockerState: BlockerState;
    blockedLocation: NavigationLocation | null;
    setBlocker: (
      id: string,
      fn:
        | ((to: NavigationLocation, from: RouteState<TMeta> | null) => boolean)
        | null,
    ) => void;
    proceedBlocked: () => void;
    resetBlocked: () => void;
  };
  route: {
    name?: string | undefined;
    meta?: TMeta | undefined;
    pattern?: string | undefined;
  };
  routeAPI: {
    generatePath: (
      name: string,
      params?: RouteParams,
      search?: RouteSearchParams | URLSearchParams,
      hash?: string,
    ) => string;
    createHref: (path: string) => string;
    hasRoute: (name: string) => boolean;
    resolveRoute: (path: string) => ResolvedRoute<TMeta> | null;
    isActive: (path: string) => boolean;
    isExact: (path: string) => boolean;
  };
}

export interface ParsedURL {
  pathname: string;
  search: string;
  searchParams: RouteSearchParams;
  hash: string;
}

export type To = string | { pathname: string; search?: string; hash?: string };

export interface LinkRenderState {
  isActive: boolean;
  isExact: boolean;
  isPending: boolean;
}

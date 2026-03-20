import type { RouteMiddleware } from './middleware';
import type {
  ResolvedRouteInfo,
  ResolvedRouteState,
  RouteConfig,
  RouteParams,
  SearchParams,
  SearchParamsPatch,
} from './route';

export type StateCompareStrategy =
  | 'reference' // by default
  | 'shallow' // Object.keys + ===
  | 'deep' // recursive Object.is
  | ((a: unknown, b: unknown) => boolean); // custom

export interface NavigationLocation {
  pathname: string;
  search: string;
  hash: string;
  state: unknown;
}

export type AfterNavigateHook<
  TMeta extends Record<string, unknown> = Record<string, unknown>,
> = (
  to: ResolvedRouteState<TMeta>,
  from: ResolvedRouteState<TMeta> | null,
) => void;

export type NavigationBlockedHook<
  TMeta extends Record<string, unknown> = Record<string, unknown>,
> = (to: NavigationLocation, from: ResolvedRouteState<TMeta> | null) => void;

export type NavigationErrorHook = (
  error: unknown,
  to: NavigationLocation,
) => boolean | void;

export interface RouterOptions<
  TMeta extends Record<string, unknown> = Record<string, unknown>,
> {
  routes?: RouteConfig<TMeta>[] | undefined;
  middlewares?: RouteMiddleware<TMeta>[] | undefined;
  scrollBehavior?: ScrollBehaviorFn<TMeta>;
  stateCompare?: StateCompareStrategy;
  afterNavigate?: AfterNavigateHook<TMeta>;
  onNavigationBlocked?: NavigationBlockedHook<TMeta>;
  onNavigationError?: NavigationErrorHook;
  debug?: boolean; // TODO: debug mode
  confirmLeave?: (
    to: NavigationLocation,
    from: ResolvedRouteState<TMeta> | null,
  ) => boolean;
  enableBeforeUnload?: boolean;
}

export interface NavigateOptions {
  replace?: boolean | undefined;
  state?: unknown;
  stateCompare?: StateCompareStrategy;
  force?: boolean;
}

export interface NavigateExternalOptions {
  target?: '_blank' | '_self'; // default: '_self'
}

export interface RouterSnapshot<
  TMeta extends Record<string, unknown> = Record<string, unknown>,
> {
  navigate: (path: string, options?: NavigateOptions) => void;
  navigateExternal: (url: string, options?: NavigateExternalOptions) => void;
  navigateByName: (
    name: string,
    params?: RouteParams,
    search?: SearchParams,
    hash?: string,
    options?: NavigateOptions,
  ) => void;
  buildPath: (
    name: string,
    params?: RouteParams,
    search?: BuildPathSearch,
  ) => string;

  back: () => void;
  forward: () => void;
  go: (delta: number) => void;
  hasRoute: (name: string) => boolean;
  resolveRoute: (path: string) => ResolvedRouteInfo<TMeta> | null;

  params: RouteParams;
  searchParams: SearchParams;
  route: {
    name: string | undefined;
    meta: TMeta | undefined;
  };
  location: {
    pathname: string;
    search: string;
    hash: string;
    state: unknown;
  };

  isActive: (path: string) => boolean;
  isExact: (path: string) => boolean;
  isNameActive: (name: string) => boolean;

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
    patch: SearchParamsPatch,
    options?: NavigateOptions,
  ) => void;
  replaceAllSearchParams: (
    params: SearchParams,
    options?: NavigateOptions,
  ) => void;
  getSearchParam: (key: string) => string | null;
  getAllSearchParams: (key: string) => string[];
  hasSearchParam: (key: string) => boolean;
}

export type ScrollPosition = { x: number; y: number };

export type ScrollTarget = ScrollPosition | 'top' | 'preserve' | null;

export type ScrollBehaviorFn<
  TMeta extends Record<string, unknown> = Record<string, unknown>,
> = (
  to: ResolvedRouteState<TMeta>,
  from: ResolvedRouteState<TMeta> | null,
  savedPosition: ScrollPosition | null,
) => ScrollTarget;

export interface InternalHistoryState {
  __routerKey: string;
  data: unknown;
}

export type BuildPathSearch = SearchParams | URLSearchParams;

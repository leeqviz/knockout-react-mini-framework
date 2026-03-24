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

export interface NavigationLocation {
  pathname: string;
  search: string;
  hash: string;
  state: unknown;
}

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

export interface RouterOptions<
  TMeta extends Record<string, unknown> = Record<string, unknown>,
> {
  routes?: RouteConfig<TMeta>[] | undefined;
  middlewares?: RouteMiddleware<TMeta>[] | undefined;
  scrollBehavior?: ScrollBehaviorStrategy<TMeta>;
  stateCompare?: StateCompareStrategy;
  afterNavigate?: AfterNavigateHook<TMeta>;
  onNavigationBlocked?: NavigationBlockedHook<TMeta>;
  onNavigationError?: NavigationErrorHook;
  debug?: boolean;
  base?: string;
  caseSensitive?: boolean;
  confirmLeave?: (
    to: NavigationLocation,
    from: RouteState<TMeta> | null,
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
  navigate: (path: string, options?: NavigateOptions) => void;
  navigateExternal: (path: string, options?: NavigateExternalOptions) => void;
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

  back: () => void;
  forward: () => void;
  go: (delta: number) => void;

  buildPath: (
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
  getSearchParam: (key: string) => string | null;
  getAllSearchParams: (key: string) => string[];
  hasSearchParam: (key: string) => boolean;

  params: RouteParams;
  searchParams: RouteSearchParams;
  route: {
    name?: string | undefined;
    meta?: TMeta | undefined;
    pattern?: string | undefined;
  };
  location: NavigationLocation;
}

export interface ParsedURL {
  pathname: string;
  search: string;
  searchParams: RouteSearchParams;
  hash: string;
}

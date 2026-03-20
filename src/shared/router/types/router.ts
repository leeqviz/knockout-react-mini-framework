import type { RouteMiddleware } from './middleware';
import type {
  ResolvedRouteState,
  RouteConfig,
  RouteParams,
  SearchParamsPatch,
} from './route';

export type StateCompareStrategy =
  | 'reference' // by default
  | 'shallow' // Object.keys + ===
  | 'deep' // recursive Object.is
  | ((a: unknown, b: unknown) => boolean); // custom

export interface RouterOptions {
  routes?: RouteConfig[] | undefined;
  middlewares?: RouteMiddleware[] | undefined;
  scrollBehavior?: ScrollBehaviorFn;
  stateCompare?: StateCompareStrategy;
}

export interface NavigateOptions {
  replace?: boolean | undefined;
  state?: unknown;
  stateCompare?: StateCompareStrategy;
  force?: boolean;
}

export interface RouterSnapshot {
  navigate: (path: string, options?: NavigateOptions) => void;
  params: RouteParams;
  searchParams: RouteParams;
  location: {
    pathname: string;
    search: string;
    hash: string;
    state: unknown;
  };
  setSearchParams: (
    newParams: SearchParamsPatch,
    options?: NavigateOptions,
  ) => void;
}

export type ScrollPosition = { x: number; y: number };

export type ScrollTarget = ScrollPosition | 'top' | 'preserve' | null;

export type ScrollBehaviorFn = (
  to: ResolvedRouteState,
  from: ResolvedRouteState | null,
  savedPosition: ScrollPosition | null,
) => ScrollTarget;

export interface InternalHistoryState {
  __routerKey: string;
  data: unknown;
}

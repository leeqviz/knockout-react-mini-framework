import type { RouteMiddleware } from './middleware';
import type { RouteConfig, RouteParams, SearchParamsPatch } from './route';

export interface RouterOptions {
  routes?: RouteConfig[] | undefined;
  middlewares?: RouteMiddleware[] | undefined;
}

export interface NavigateOptions {
  replace?: boolean | undefined;
  state?: unknown;
}

export interface RouterSnapshot {
  navigate: (path: string, options?: NavigateOptions) => void;
  params: RouteParams;
  searchParams: RouteParams;
  location: {
    pathname: string;
    search: string;
    state: unknown;
  };
  setSearchParams: (
    newParams: SearchParamsPatch,
    options?: NavigateOptions,
  ) => void;
}

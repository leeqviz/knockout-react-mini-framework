import type { RouteMiddleware } from './middleware';

export interface RouteConfig {
  pattern: string;
  component: string;
  middlewares?: RouteMiddleware[] | undefined;
}

export type RouteParams = Record<string, string>;

export type SearchParamsPatch = Record<
  string,
  string | number | boolean | null | undefined
>;

export interface ResolvedRouteState {
  pathname: string;
  search: string;
  component: string;
  params: RouteParams;
  searchParams: RouteParams;
  state: unknown;
}

export type ResolveResult =
  | { type: 'blocked' }
  | { type: 'redirect'; to: string }
  | { type: 'resolved'; value: ResolvedRouteState };

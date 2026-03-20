import { ResolveResultType } from '../route';
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
  hash: string;
}

export type BlockedResult = {
  type: typeof ResolveResultType.Blocked;
  reason?: string;
};

export type RedirectResult = {
  type: typeof ResolveResultType.Redirect;
  to: string;
  replace?: boolean;
};

export type RewriteResult = {
  type: typeof ResolveResultType.Rewrite;
  to: string;
  replace?: boolean;
};

export type ErrorResult = {
  type: typeof ResolveResultType.Error;
  error: Error;
};

export type ResolvedResult = {
  type: typeof ResolveResultType.Resolved;
  value: ResolvedRouteState;
};

export type ResolveResult =
  | BlockedResult
  | RedirectResult
  | RewriteResult
  | ResolvedResult
  | ErrorResult;

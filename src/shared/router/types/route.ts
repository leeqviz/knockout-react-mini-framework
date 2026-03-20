import { ResolveResultType } from '../route';
import type { RouteMiddleware } from './middleware';

export interface QueryParamConfig {
  default?: string;
  required?: boolean;
}

export interface RouteConfig<
  TMeta extends Record<string, unknown> = Record<string, unknown>,
> {
  pattern: string;
  component: string;
  name?: string; // id
  meta?: TMeta;
  middlewares?: RouteMiddleware<TMeta>[] | undefined;
  paramValidators?: Record<string, RegExp | string[]>;
  queryParams?: Record<string, QueryParamConfig>;
}

export type RouteParams = Record<string, string>;

export type SearchParamValue = string | string[];

export type SearchParams = Record<string, SearchParamValue>;

export type SearchParamsPatch = Record<
  string,
  string | string[] | null | undefined
>;

export interface ResolvedRouteState<
  TMeta extends Record<string, unknown> = Record<string, unknown>,
> {
  pathname: string;
  search: string;
  component: string;
  params: RouteParams;
  searchParams: SearchParams;
  state: unknown;
  hash: string;
  name: string | undefined;
  meta: TMeta | undefined;
}

export interface ResolvedRouteInfo<
  TMeta extends Record<string, unknown> = Record<string, unknown>,
> {
  name: string | undefined;
  meta: TMeta | undefined;
  component: string;
  params: RouteParams;
  pattern: string;
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

export type ResolvedResult<
  TMeta extends Record<string, unknown> = Record<string, unknown>,
> = {
  type: typeof ResolveResultType.Resolved;
  value: ResolvedRouteState<TMeta>;
};

export type ResolveResult<
  TMeta extends Record<string, unknown> = Record<string, unknown>,
> =
  | BlockedResult
  | RedirectResult
  | RewriteResult
  | ResolvedResult<TMeta>
  | ErrorResult;

import type { ResolveResult } from './route';

export interface RouteMiddlewareContext<
  TMeta extends Record<string, unknown> = Record<string, unknown>,
> {
  pathname: string;
  search: string;
  state: unknown;
  meta?: TMeta | undefined;
}

export type RouteMiddlewareResult<
  TMeta extends Record<string, unknown> = Record<string, unknown>,
> = void | ResolveResult<TMeta>;

export type RouteMiddleware<
  TMeta extends Record<string, unknown> = Record<string, unknown>,
> = (context: RouteMiddlewareContext<TMeta>) => RouteMiddlewareResult<TMeta>;

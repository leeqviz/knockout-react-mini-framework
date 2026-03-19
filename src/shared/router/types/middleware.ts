import type { ResolveResult } from './route';

export interface RouteMiddlewareContext {
  pathname: string;
  search: string;
  state: unknown;
}

export type RouteMiddlewareResult = void | ResolveResult;

export type RouteMiddleware = (
  context: RouteMiddlewareContext,
) => RouteMiddlewareResult;

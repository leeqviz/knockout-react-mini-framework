import type { ResolveResult } from './route';

export interface RouteMiddlewareContext {
  fullPath: string;
  pathname: string;
  search: string;
  state: unknown;
}

export type RouteMiddlewareResult = void | ResolveResult;

export type RouteMiddleware = (
  context: RouteMiddlewareContext,
) => RouteMiddlewareResult;

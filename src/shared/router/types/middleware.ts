import type { NavigateOptions } from './navigate';

export interface RouteMiddlewareContext {
  navigate: (path: string, options?: NavigateOptions) => void;
  fullPath: string;
  pathname: string;
  search: string;
  state: unknown;
}

export type RouteMiddleware = (
  context: RouteMiddlewareContext,
) => boolean | string | void;

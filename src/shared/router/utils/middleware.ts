import type {
  BlockedResult,
  ErrorResult,
  RedirectResult,
  ResolvedResult,
  ResolveResult,
  RewriteResult,
  RouteMiddleware,
  RouteMiddlewareContext,
  RouteMiddlewareResult,
} from '../types';
import { ResolveResultType } from './route';

export function runMiddlewares<
  TMeta extends Record<string, unknown> = Record<string, unknown>,
>(
  middlewares: RouteMiddleware<TMeta>[],
  context: RouteMiddlewareContext<TMeta>,
): RouteMiddlewareResult<TMeta> {
  for (const middleware of middlewares) {
    const result = middleware(context);
    if (result) return result;
  }
}

export function handleResolveResult<
  TMeta extends Record<string, unknown> = Record<string, unknown>,
>(
  result: ResolveResult<TMeta>,
  options: {
    onBlocked: (result: BlockedResult) => void;
    onError: (result: ErrorResult) => void;
    onRedirect: (result: RedirectResult) => void;
    onRewrite: (result: RewriteResult) => void;
    onResolved: (result: ResolvedResult<TMeta>) => void;
  },
): void {
  switch (result.type) {
    case ResolveResultType.Error: {
      options.onError(result);
      return;
    }
    case ResolveResultType.Blocked: {
      options.onBlocked(result);
      return;
    }
    case ResolveResultType.Rewrite: {
      options.onRewrite(result);
      return;
    }
    case ResolveResultType.Redirect: {
      options.onRedirect(result);
      return;
    }
    case ResolveResultType.Resolved: {
      options.onResolved(result);
      return;
    }
    default: {
      return;
    }
  }
}

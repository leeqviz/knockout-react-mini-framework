import type {
  QueryParamConfig,
  RouteConfig,
  RouteParams,
  SearchParams,
} from '../types';
import { normalizePath } from './url';

export function applyQueryParamConfig(
  searchParams: SearchParams,
  config?: Record<string, QueryParamConfig>,
): { valid: boolean; searchParams: SearchParams } {
  if (!config) return { valid: true, searchParams };

  const result: SearchParams = { ...searchParams };

  for (const [key, paramConfig] of Object.entries(config)) {
    if (result[key] === undefined) {
      if (paramConfig.required && paramConfig.default === undefined)
        return { valid: false, searchParams: result };

      if (paramConfig.default !== undefined) result[key] = paramConfig.default;
    }
  }

  return { valid: true, searchParams: result };
}

export function validateParams(
  params: RouteParams,
  validators: Record<string, RegExp | string[]>,
): boolean {
  return Object.entries(validators).every(([key, validator]) => {
    const value = params[key];
    if (value === undefined) return true;
    if (Array.isArray(validator)) return validator.includes(value);
    return validator.test(value);
  });
}

export function matchSegments(
  patternSegments: string[],
  pathSegments: string[],
  patternIndex: number,
  pathIndex: number,
  params: RouteParams,
  caseSensitive: boolean = false,
): RouteParams | null {
  if (patternIndex === patternSegments.length)
    return pathIndex === pathSegments.length ? params : null;

  const patternSegment = patternSegments[patternIndex];

  if (!patternSegment) return null;

  if (isWildcardSegment(patternSegment)) {
    if (patternIndex !== patternSegments.length - 1) return null;

    return {
      ...params,
      [getWildcardParamName(patternSegment)]: pathSegments
        .slice(pathIndex)
        .join('/'),
    };
  }

  const pathSegment = pathSegments[pathIndex];

  if (patternSegment.startsWith(':')) {
    const isOptional = patternSegment.endsWith('?');
    const paramName = patternSegment.slice(1, isOptional ? -1 : undefined);

    if (!paramName) return null;

    if (isOptional) {
      const skipped = matchSegments(
        patternSegments,
        pathSegments,
        patternIndex + 1,
        pathIndex,
        params,
        caseSensitive,
      );

      if (skipped) return skipped;
    }

    if (pathSegment === undefined) return null;

    return matchSegments(
      patternSegments,
      pathSegments,
      patternIndex + 1,
      pathIndex + 1,
      {
        ...params,
        [paramName]: pathSegment,
      },
      caseSensitive,
    );
  }

  const segmentsMatch = caseSensitive
    ? patternSegment === pathSegment
    : patternSegment.toLowerCase() === pathSegment?.toLowerCase();

  if (pathSegment === undefined || !segmentsMatch) return null;

  return matchSegments(
    patternSegments,
    pathSegments,
    patternIndex + 1,
    pathIndex + 1,
    params,
    caseSensitive,
  );
}

export function matchRoute(
  pattern: string,
  pathname: string,
  caseSensitive: boolean = false,
): RouteParams | null {
  const normalizedPattern = normalizePath(pattern);
  const patternSegments = normalizedPattern.split('/').filter(Boolean);
  const pathSegments = pathname.split('/').filter(Boolean);

  return matchSegments(patternSegments, pathSegments, 0, 0, {}, caseSensitive);
}

export function getWildcardParamName(segment: string): string {
  return segment.length > 1 ? segment.slice(1) : 'wildcard';
}

export function isWildcardSegment(segment: string): boolean {
  return segment === '*' || segment.startsWith('*');
}

export function getRouteScore(pattern: string): number {
  const segments = normalizePath(pattern).split('/').filter(Boolean);

  if (segments.length === 0) return 10_000;

  return (
    segments.reduce((score, segment) => {
      if (isWildcardSegment(segment)) return score + 1;

      if (segment.startsWith(':'))
        return score + (segment.endsWith('?') ? 200 : 300);

      return score + 400;
    }, 0) + segments.length
  );
}

export function rankRoutes<
  TMeta extends Record<string, unknown> = Record<string, unknown>,
>(routes: RouteConfig<TMeta>[]): RouteConfig<TMeta>[] {
  const names = routes.map((r) => r.name).filter(Boolean);
  const duplicates = names.filter((n, i) => names.indexOf(n) !== i);
  if (duplicates.length > 0)
    throw new Error(
      `Duplicate route names found: ${[...new Set(duplicates)].join(', ')}`,
    );

  return routes
    .map((route, index) => ({
      route,
      index,
      score: getRouteScore(route.pattern),
    }))
    .sort((left, right) => {
      return right.score - left.score || left.index - right.index;
    })
    .map((item) => item.route);
}

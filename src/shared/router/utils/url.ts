import type { SearchParams } from '../types';

export function normalizePath(path: string): string {
  if (!path || path === '/') return '/';
  return path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
}

export function stripBase(pathname: string, base?: string): string {
  if (!base) return pathname;
  if (pathname === base) return '/';
  if (pathname.startsWith(base + '/')) return pathname.slice(base.length);
  return pathname;
}

export function addBase(pathname: string, base?: string): string {
  if (!base) return pathname;
  if (pathname === '/') return base + '/';
  return base + pathname;
}

export function normalizeFullPath(fullPath: string): string {
  const url = new URL(fullPath, window.location.origin);
  return normalizePath(stripBase(url.pathname)) + url.search;
}

export function parseUrl(url: URL): {
  pathname: string;
  search: string;
  searchParams: SearchParams;
  hash: string;
} {
  const searchParams: SearchParams = {};

  url.searchParams.forEach((value, key) => {
    const existing = searchParams[key];
    if (existing === undefined) searchParams[key] = value;
    else if (Array.isArray(existing)) existing.push(value);
    else searchParams[key] = [existing, value];
  });

  return {
    pathname: normalizePath(url.pathname),
    search: url.search,
    searchParams,
    hash: url.hash,
  };
}

export function getCurrentFullPath(): string {
  return (
    normalizePath(stripBase(window.location.pathname)) + window.location.search
  );
}

export function normalizeBase(base: string): string {
  if (!base || base === '/') return '';
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

import { RouterProvider, type RouterSnapshot } from '@/shared/router';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { vi } from 'vitest';

export const mockedRouterContextValue: RouterSnapshot = {
  params: {},
  searchParams: {},
  searchParamsAPI: {
    setSearchParam: vi.fn(),
    appendSearchParam: vi.fn(),
    deleteSearchParam: vi.fn(),
    patchSearchParams: vi.fn(),
    replaceAllSearchParams: vi.fn(),
    getSearchParam: vi.fn(),
    getAllSearchParams: vi.fn(),
    hasSearchParam: vi.fn(),
  },
  location: {
    pathname: '/',
    search: '',
    hash: '',
    state: null,
  },
  locationAPI: {
    navigate: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    go: vi.fn(),
    navigateExternal: vi.fn(),
    isPending: false,
    pendingLocation: null,
    navigationType: 'push',
    blockerState: 'unblocked',
    blockedLocation: null,
    setBlocker: vi.fn(),
    proceedBlocked: vi.fn(),
    resetBlocked: vi.fn(),
  },
  route: {
    name: undefined,
    meta: undefined,
    pattern: undefined,
    mask: undefined,
  },
  routeAPI: {
    generatePath: vi.fn(),
    resolveRoute: vi.fn(),
    createHref: vi.fn(),
    isActive: vi.fn(),
    isExact: vi.fn(),
    hasRoute: vi.fn(),
  },
};

export function renderWithRouterContext(
  ui: ReactElement,
  partialRouterContextValue: Partial<RouterSnapshot> = {},
) {
  const routerContextValue = {
    ...mockedRouterContextValue,
    ...partialRouterContextValue,
  };
  render(<RouterProvider value={routerContextValue}>{ui}</RouterProvider>);
  return routerContextValue;
}

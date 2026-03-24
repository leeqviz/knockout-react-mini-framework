import { RouterProvider, type RouterSnapshot } from '@/shared/router';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { vi } from 'vitest';

export const mockedRouterContextValue: RouterSnapshot = {
  navigate: vi.fn(),
  buildPath: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  go: vi.fn(),
  hasRoute: vi.fn(),
  navigateExternal: vi.fn(),
  resolveRoute: vi.fn(),
  createHref: vi.fn(),
  isNavigating: false,
  route: { name: undefined, meta: undefined, pattern: undefined },
  params: {},
  searchParams: {},
  location: {
    pathname: '/',
    search: '',
    hash: '',
    state: null,
  },
  isActive: vi.fn(),
  isExact: vi.fn(),
  setSearchParam: vi.fn(),
  appendSearchParam: vi.fn(),
  deleteSearchParam: vi.fn(),
  patchSearchParams: vi.fn(),
  replaceAllSearchParams: vi.fn(),
  getSearchParam: vi.fn(),
  getAllSearchParams: vi.fn(),
  hasSearchParam: vi.fn(),
  navigationType: 'push',
  blockerState: 'unblocked',
  blockedTo: null,
  setBlocker: vi.fn(),
  proceedBlocked: vi.fn(),
  resetBlocked: vi.fn(),
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

import { RouterProvider, type RouterSnapshot } from '@/shared/router';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { vi } from 'vitest';

export const mockedRouterContextValue: RouterSnapshot = {
  navigate: vi.fn(),
  navigateByName: vi.fn(),
  buildPath: vi.fn(),
  route: { name: undefined, meta: undefined },
  params: {},
  searchParams: {},
  location: {
    pathname: '/',
    search: '',
    hash: '',
    state: null,
  },
  setSearchParam: vi.fn(),
  appendSearchParam: vi.fn(),
  deleteSearchParam: vi.fn(),
  patchSearchParams: vi.fn(),
  replaceAllSearchParams: vi.fn(),
  getSearchParam: vi.fn(),
  getAllSearchParams: vi.fn(),
  hasSearchParam: vi.fn(),
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

import { RouterProvider, type RouterSnapshot } from '@/shared/router';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { vi } from 'vitest';

export const mockedRouterContextValue: RouterSnapshot = {
  navigate: vi.fn(),
  params: {},
  searchParams: {},
  location: {
    pathname: '/',
    search: '',
    hash: '',
    state: null,
  },
  setSearchParams: vi.fn(),
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

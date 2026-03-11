import type { RouterContextValue } from '@/lib/react/contexts/routing';
import { vi } from 'vitest';

export const mockedRouterContextValue: RouterContextValue = {
  navigate: vi.fn(),
  params: {},
  location: {
    pathname: '/',
    search: '',
  },
  setSearchParams: vi.fn(),
};

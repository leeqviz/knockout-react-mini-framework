import { createContext } from 'react';

export interface RouterContextValue {
  navigate: (path: string, options?: { replace?: boolean | undefined }) => void;
  params: Record<string, string>;
  location: {
    pathname: string; // example: '/users'
    search: string; // example: '?id=1'
  };
  setSearchParams: (params: Record<string, string>) => void;
}

export const RouterContext = createContext<RouterContextValue | null>(null);

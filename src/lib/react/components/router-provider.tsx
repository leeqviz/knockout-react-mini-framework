import type { ReactNode } from 'react';
import { RouterContext, type RouterContextValue } from './router-context';

interface RouterProviderProps {
  children: ReactNode;
  value: RouterContextValue | null;
}

export function RouterProvider({ children, value }: RouterProviderProps) {
  console.log('Router context data: ', value);
  return (
    <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
  );
}

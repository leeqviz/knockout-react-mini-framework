import { RouterContext, type RouterSnapshot } from '@/shared/router';
import type { PropsWithChildren } from 'react';

interface RouterProviderProps extends PropsWithChildren {
  value: RouterSnapshot | null;
}

export function RouterProvider({ children, value }: RouterProviderProps) {
  console.log('Router: ', value);
  return (
    <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
  );
}

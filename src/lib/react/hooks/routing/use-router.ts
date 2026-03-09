import {
  RouterContext,
  type RouterContextValue,
} from '@/lib/react/components/router-context';
import { useContext } from 'react';

export function useRouter(): RouterContextValue {
  const context = useContext(RouterContext);

  if (!context) {
    throw new Error(
      'useRouter must be used within a component wrapped by RouterProvider!',
    );
  }

  return context;
}

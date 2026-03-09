import { ErrorBoundary } from '@/lib/react/components/error-boundary';
import type { RouterContextValue } from '@/lib/react/components/router-context';
import { RouterProvider } from '@/lib/react/components/router-provider';
import { MainContainer } from './components/main-container';

export interface MainEntryPointProps {
  router: RouterContextValue | null;
}

export function MainEntryPoint({ router }: MainEntryPointProps) {
  console.log('MainEntryPoint router: ', router);
  return (
    <ErrorBoundary name="Main Module">
      <RouterProvider value={router}>
        <MainContainer />
      </RouterProvider>
    </ErrorBoundary>
  );
}

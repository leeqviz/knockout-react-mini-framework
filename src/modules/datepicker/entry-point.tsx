import { ErrorBoundary } from '@/lib/react/components/error-boundary';
import type { RouterContextValue } from '@/lib/react/components/router-context';
import { RouterProvider } from '@/lib/react/components/router-provider';
import { DatepickerContainer } from './components/datepicker-container';

export interface DatepickerEntryPointProps {
  router: RouterContextValue | null;
}

export function DatepickerEntryPoint({ router }: DatepickerEntryPointProps) {
  return (
    <ErrorBoundary name="Datepicker Module">
      <RouterProvider value={router}>
        <DatepickerContainer />
      </RouterProvider>
    </ErrorBoundary>
  );
}

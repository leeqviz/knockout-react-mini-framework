import { RouterProvider } from '@/shared/router';
import type { RouterSnapshot } from '@/shared/router/types';
import { ErrorBoundary } from '@/shared/ui/error-boundary';
import { DatepickerContainer } from './components/datepicker-container';

export interface DatepickerEntryPointProps {
  router: RouterSnapshot | null;
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

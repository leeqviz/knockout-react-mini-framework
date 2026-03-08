import { ErrorBoundary } from '@/lib/react/components/error-boundary';
import { DatepickerContainer } from './components/datepicker-container';

export interface DatepickerEntryPointProps {
  date: string;
  setDate: (newDate: string) => void;
  route: unknown;
}

export function DatepickerEntryPoint({
  date,
  setDate,
  route,
}: DatepickerEntryPointProps) {
  console.log('DatepickerEntryPoint url params: ', route);
  return (
    <ErrorBoundary name="Datepicker Module">
      <DatepickerContainer date={date} setDate={setDate} />
    </ErrorBoundary>
  );
}

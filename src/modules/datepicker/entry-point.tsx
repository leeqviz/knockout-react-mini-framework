import { ErrorBoundary } from "@/shared/react/components/error-boundary";
import { TestDatepicker } from "./components/test-datepicker";

export interface DatepickerEntryPointProps {
  date: string;
  setDate: (newDate: string) => void;
}

export function DatepickerEntryPoint({
  date,
  setDate,
}: DatepickerEntryPointProps) {
  return (
    <ErrorBoundary name="Datepicker Module">
      <TestDatepicker date={date} setDate={setDate} />
    </ErrorBoundary>
  );
}

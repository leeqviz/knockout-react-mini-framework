import { ErrorBoundary } from '@/lib/react/components/error-boundary';
import { MainContainer } from './components/main-container';

export interface MainEntryPointProps {
  count: number;
  setCount: (value: number) => void;
}

export function MainEntryPoint({ count, setCount }: MainEntryPointProps) {
  return (
    <ErrorBoundary name="Main Module">
      <MainContainer count={count} setCount={setCount} />
    </ErrorBoundary>
  );
}

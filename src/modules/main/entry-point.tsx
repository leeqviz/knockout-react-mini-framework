import { ErrorBoundary } from '@/components/error-boundary';
import { TestInput } from './components/test-input';
import { UsersList } from './components/users-list';

export interface MainEntryPointProps {
  count: number;
  setCount: (value: number) => void;
}

export function MainEntryPoint({ count, setCount }: MainEntryPointProps) {
  return (
    <ErrorBoundary name="Main Module">
      <TestInput count={count} setCount={setCount} />
      <UsersList />
    </ErrorBoundary>
  );
}

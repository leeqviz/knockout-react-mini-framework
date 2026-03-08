import { appEventBus } from '@/lib/ko/event-bus';
import { DefaultContainer } from '@/lib/react/components/default-container';
import { useEffect } from 'react';
import { LinkedInput } from './linked-input';
import { UsersList } from './users-list';

interface MainContainerProps {
  count: number;
  setCount: (value: number) => void;
}

export function MainContainer({ count, setCount }: MainContainerProps) {
  useEffect(() => {
    appEventBus.publish('REACT_COMPONENT_READY', { componentId: 'main' });

    return () => {
      //subscription.dispose();
    };
  }, []);

  return (
    <DefaultContainer moduleName="Main module">
      <LinkedInput count={count} setCount={setCount} />
      <div className="bg-red-300 h-0.5" />
      <UsersList />
    </DefaultContainer>
  );
}

import { appEventBus, ApplicationEvent } from '@/lib/ko/event-bus';
import { DefaultContainer } from '@/lib/react/components/containers';
import { useRouter } from '@/lib/react/hooks/routing';
import { useEffect } from 'react';
import { LinkedInput } from './linked-input';
import { UsersList } from './users-list';

export function MainContainer() {
  const router = useRouter();
  console.log('MainContainer router: ', router);

  useEffect(() => {
    appEventBus.publish(ApplicationEvent.REACT_COMPONENT_RENDER, {
      name: 'main',
    });
  }, []);

  return (
    <DefaultContainer moduleName="Main module">
      <LinkedInput />
      <div className="bg-red-300 h-0.5" />
      <UsersList />
      <button onClick={() => router.navigate('/test')}>Go to test</button>
    </DefaultContainer>
  );
}

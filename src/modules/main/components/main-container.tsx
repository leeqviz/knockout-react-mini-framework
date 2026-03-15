import {
  appEventBus,
  ApplicationEvent,
  type ApplicationEventPayloadMap,
} from '@/lib/ko/event-bus/app';
import { DefaultContainer } from '@/lib/react/components/containers';
import { Link } from '@/lib/react/components/routing';
import { useRouter } from '@/lib/react/hooks/routing';
import { useEffect } from 'react';
import { LinkedInput } from './linked-input';
import { UsersList } from './users-list';

export function MainContainer() {
  const router = useRouter();
  console.log('MainContainer router: ', router);

  useEffect(() => {
    const payload: ApplicationEventPayloadMap['react/component-render'] = {
      name: 'main',
    };
    appEventBus.publish(ApplicationEvent.REACT_COMPONENT_RENDER, payload);
  }, []);

  return (
    <DefaultContainer moduleName="Main module">
      <LinkedInput />
      <div className="bg-red-300 h-0.5" />
      <UsersList />
      <Link to="/test">Go to test</Link>
      <button onClick={() => router.navigate('/test')}>Go to test</button>
    </DefaultContainer>
  );
}

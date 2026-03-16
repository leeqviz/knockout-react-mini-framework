import {
  AppEvent,
  appEventBus,
  type AppEventPayloadMap,
} from '@/shared/event-bus';
import { useRouter } from '@/shared/router';
import { DefaultContainer } from '@/shared/ui/container';
import { Link } from '@/shared/ui/link';
import { useEffect } from 'react';
import { LinkedInput } from './linked-input';
import { UsersList } from './users-list';

export function MainContainer() {
  const router = useRouter();
  console.log('MainContainer router: ', router);

  useEffect(() => {
    const payload: AppEventPayloadMap['react/component-render'] = {
      name: 'main',
    };
    appEventBus.publish(AppEvent.REACT_COMPONENT_RENDER, payload);
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

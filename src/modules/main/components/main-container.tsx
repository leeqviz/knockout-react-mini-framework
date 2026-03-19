import {
  AppEvent,
  appEventBus,
  type AppEventPayloadMap,
} from '@/shared/event-bus';
import { RouterLink, useRouter } from '@/shared/router';
import { DefaultContainer } from '@/shared/ui/container';
import { useEffect } from 'react';
import { LinkedInput } from './linked-input';
import { UsersList } from './users-list';

export function MainContainer() {
  const router = useRouter();

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
      <RouterLink to="/test">Go to test</RouterLink>
      <button onClick={() => router.navigate('/test')}>Go to test</button>
    </DefaultContainer>
  );
}

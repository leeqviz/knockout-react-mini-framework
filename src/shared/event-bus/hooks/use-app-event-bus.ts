import { useEffect } from 'react';
import { appEventBus } from '../app-event-bus';
import type { AppEventName, AppEventPayloadMap } from '../types';

export function useAppEventBus<T extends AppEventName>(
  event: T,
  callback: (payload: AppEventPayloadMap[T]) => void,
) {
  useEffect(() => {
    const subscription = appEventBus.subscribe(event, callback);

    return () => {
      subscription.dispose();
    };
  }, [event, callback]);
}

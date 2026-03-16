import {
  AppEvent,
  appEventBus,
  type AppEventPayloadMap,
} from '@/shared/event-bus';
import { DefaultContainer } from '@/shared/ui/container';
import { useEffect } from 'react';
import { JqueryDatepicker } from './jquery-datepicker';

export function DatepickerContainer() {
  useEffect(() => {
    const payload: AppEventPayloadMap['react/component-render'] = {
      name: 'datepicker',
    };
    appEventBus.publish(AppEvent.REACT_COMPONENT_RENDER, payload);
  }, []);

  return (
    <DefaultContainer moduleName="Datepicker module">
      <JqueryDatepicker />
    </DefaultContainer>
  );
}

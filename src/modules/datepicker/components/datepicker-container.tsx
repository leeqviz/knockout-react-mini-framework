import { appEventBus, ApplicationEvent } from '@/lib/ko/event-bus';
import { DefaultContainer } from '@/lib/react/components/containers';
import { useEffect } from 'react';
import { JqueryDatepicker } from './jquery-datepicker';

export function DatepickerContainer() {
  useEffect(() => {
    appEventBus.publish(ApplicationEvent.REACT_COMPONENT_RENDER, {
      name: 'datepicker',
    });
  }, []);

  return (
    <DefaultContainer moduleName="Datepicker module">
      <JqueryDatepicker />
    </DefaultContainer>
  );
}

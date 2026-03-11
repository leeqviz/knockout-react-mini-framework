import { appEventBus } from '@/lib/ko/event-bus';
import { DefaultContainer } from '@/lib/react/components/containers';
import { useEffect } from 'react';
import { JqueryDatepicker } from './jquery-datepicker';

export function DatepickerContainer() {
  useEffect(() => {
    appEventBus.publish('REACT_COMPONENT_READY', { componentId: 'datepicker' });

    return () => {};
  }, []);

  return (
    <DefaultContainer moduleName="Datepicker module">
      <JqueryDatepicker />
    </DefaultContainer>
  );
}

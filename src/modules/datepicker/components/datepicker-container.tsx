import { appEventBus } from '@/lib/ko/event-bus';
import { DefaultContainer } from '@/lib/react/components/default-container';
import { useEffect } from 'react';
import { JqueryDatepicker } from './jquery-datepicker';

interface DatepickerContainerProps {
  date: string;
  setDate: (newDate: string) => void;
}

export function DatepickerContainer({
  date,
  setDate,
}: DatepickerContainerProps) {
  useEffect(() => {
    appEventBus.publish('REACT_COMPONENT_READY', { componentId: 'datepicker' });

    return () => {
      //subscription.dispose();
    };
  }, []);

  return (
    <DefaultContainer moduleName="Datepicker module">
      <JqueryDatepicker date={date} setDate={setDate} />
    </DefaultContainer>
  );
}

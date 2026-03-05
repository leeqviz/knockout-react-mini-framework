import { DatepickerViewModel } from '@/lib/models/datepicker';
import ko from 'knockout';

ko.components.register('datepicker-widget', {
  viewModel: DatepickerViewModel,
  template: /*html*/ `
    <div
        data-bind="reactDatepicker: { 
            component, 
            props
        }"
      ></div>
    `,
});

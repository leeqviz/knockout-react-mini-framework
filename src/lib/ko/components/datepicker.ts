import { DatepickerViewModel } from '@/lib/ko/models/datepicker';

export const datepickerComponent: KnockoutComponentTypes.Config<
  typeof DatepickerViewModel
> = {
  viewModel: DatepickerViewModel,
  template: /*html*/ `
    <div
        data-bind="reactDatepicker: { 
            component, 
            props: computedProps()
        }"
      ></div>
    `,
};

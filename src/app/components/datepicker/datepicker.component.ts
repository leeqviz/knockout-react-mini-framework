import { DatepickerViewModel } from './datepicker.model';
import datepickerTemplate from './datepicker.template.html?raw';

export const datepickerComponent: KnockoutComponentTypes.Config<
  typeof DatepickerViewModel
> = {
  viewModel: DatepickerViewModel,
  template: datepickerTemplate,
};

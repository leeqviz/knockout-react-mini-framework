import { MainViewModel } from '@/lib/ko/models/main';

export const mainComponent: KnockoutComponentTypes.Config<
  typeof MainViewModel
> = {
  viewModel: MainViewModel,
  template: /*html*/ `
    <div
        data-bind="reactMain: { 
            component, 
            props: computedProps()
        }"
      ></div>
    `,
};

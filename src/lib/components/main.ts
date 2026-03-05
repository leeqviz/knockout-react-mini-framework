import { MainViewModel } from '@/lib/models/main';
import ko from 'knockout';

ko.components.register('main-widget', {
  viewModel: MainViewModel,
  template: /*html*/ `
    <div
        data-bind="reactMain: { 
            component, 
            props
        }"
      ></div>
    `,
});

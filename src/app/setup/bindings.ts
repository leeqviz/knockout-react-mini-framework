import {
  linkBindingHandler,
  navigateBindingHandler,
  reactBindingHandler,
} from '@/app/bindings';
import ko from 'knockout';

const bindingHandlers = {
  link: linkBindingHandler,
  navigate: navigateBindingHandler,
  reactMain: reactBindingHandler,
  reactDatepicker: reactBindingHandler,
};

export function setupBindings() {
  Object.entries(bindingHandlers).forEach(([name, handler]) => {
    ko.bindingHandlers[name] = handler;
  });
}

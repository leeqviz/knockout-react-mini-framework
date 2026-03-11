import * as ko from 'knockout';
import { appRouter } from '../router';

export const navigateBindingHandler: KnockoutBindingHandler = {
  init: function (element: HTMLElement, valueAccessor) {
    function onClick() {
      // get path from binding
      const path = ko.unwrap(valueAccessor());

      if (path) {
        appRouter.navigate(path);
      }
    }

    element.addEventListener('click', onClick);

    ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
      element.removeEventListener('click', onClick);
    });
  },
};

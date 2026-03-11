import ko from 'knockout';
import { appRouter } from '../router';

export const linkBindingHandler: KnockoutBindingHandler = {
  init: function (element: HTMLElement) {
    function onClick(e: MouseEvent) {
      // cancel default behavior
      e.preventDefault();

      const path = element.getAttribute('href');

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

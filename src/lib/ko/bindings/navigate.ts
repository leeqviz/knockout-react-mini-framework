import * as ko from 'knockout';
import { appRouter } from '../router';

export const navigateBindingHandler: KnockoutBindingHandler = {
  init: function (element: HTMLElement, valueAccessor: () => string) {
    function onClick(e: MouseEvent) {
      e.preventDefault();

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
  update: function (element: HTMLElement, valueAccessor: () => string) {
    const targetPath = ko.unwrap(valueAccessor());

    const currentPath = appRouter.currentPathname();

    if (targetPath === currentPath) element.classList.add('active');
    else element.classList.remove('active');
  },
};

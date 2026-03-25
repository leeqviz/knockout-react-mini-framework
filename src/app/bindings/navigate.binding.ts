import { appRouter } from '@/app/router';
import ko from 'knockout';

export const navigateBindingHandler: KnockoutBindingHandler = {
  init: function (element: HTMLElement, valueAccessor: () => unknown) {
    function onClick(e: MouseEvent) {
      e.preventDefault();

      const path = ko.unwrap(valueAccessor());

      if (path && typeof path === 'string') {
        appRouter.navigate(path);
      }
    }

    element.addEventListener('click', onClick);
    ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
      element.removeEventListener('click', onClick);
    });
  },
  update: function (element: HTMLElement, valueAccessor: () => unknown) {
    const targetPath = ko.unwrap(valueAccessor());

    const currentPath = appRouter.currentPathname();

    if (targetPath === currentPath) element.classList.add('active');
    else element.classList.remove('active');
  },
};

import { appRouter } from '@/app/router';
import ko from 'knockout';

export const linkBindingHandler: KnockoutBindingHandler = {
  init: function (element: HTMLElement) {
    function onClick(e: MouseEvent) {
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
  update: function (element: HTMLElement) {
    const targetPath = element.getAttribute('href');

    const currentPath = appRouter.currentPathname();

    if (targetPath === currentPath) element.classList.add('active');
    else element.classList.remove('active');
  },
};

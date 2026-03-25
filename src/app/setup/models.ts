import { AppViewModel } from '@/app/models';
import ko from 'knockout';

const bindingMap = [
  {
    modelConstructor: AppViewModel,
    elementId: 'root',
  },
];

export function setupModels() {
  bindingMap.forEach(({ modelConstructor, elementId }) => {
    const element = document.getElementById(elementId);
    if (!element) throw new Error(`${elementId} element not found`);

    ko.applyBindings(new modelConstructor(), element);
  });
}

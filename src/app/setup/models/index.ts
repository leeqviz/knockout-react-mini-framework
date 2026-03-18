import { AppViewModel } from '@/app/models';

export function setupModels(rootElement: HTMLElement) {
  ko.applyBindings(new AppViewModel(), rootElement);
}

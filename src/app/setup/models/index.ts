import { AppViewModel } from './app.model';

export function setupModels(rootElement: HTMLElement) {
  ko.applyBindings(new AppViewModel(), rootElement);
}

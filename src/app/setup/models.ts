import { AppViewModel } from '@/app/models';
import { applyBindings } from '@/shared/utils/ko';

const bindingMap = [
  {
    model: AppViewModel,
    elementId: 'root',
  },
];

export function setupModels() {
  bindingMap.forEach(({ model, elementId }) => applyBindings(model, elementId));
}

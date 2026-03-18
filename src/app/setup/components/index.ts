import {
  datepickerComponentMeta,
  datepickerLazyComponentMeta,
} from '@/app/components/datepicker';
import {
  mainComponentMeta,
  mainLazyComponentMeta,
} from '@/app/components/main';
import {
  notFoundComponentMeta,
  notFoundLazyComponentMeta,
} from '@/app/components/not-found';
import { registerComponent } from '@/shared/utils/ko';

const components = [
  mainComponentMeta,
  mainLazyComponentMeta,
  datepickerComponentMeta,
  datepickerLazyComponentMeta,
  notFoundComponentMeta,
  notFoundLazyComponentMeta,
];

export function setupComponents() {
  components.forEach((component) =>
    component.lazy
      ? registerComponent(component.name, { lazy: component.lazy })
      : registerComponent(component.name, { ...component.component }),
  );
}

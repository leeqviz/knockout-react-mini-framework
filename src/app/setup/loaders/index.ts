import { ko } from '@/shared/lib/ko';
import { lazyComponentLoader } from './lazy-component.loader';

export function setupLoaders() {
  ko.components.loaders.unshift(lazyComponentLoader);
}

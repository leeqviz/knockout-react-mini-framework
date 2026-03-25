import { lazyComponentLoader } from '@/app/loaders';
import ko from 'knockout';

const loaders = [lazyComponentLoader]; // order is important

export function setupLoaders() {
  ko.components.loaders.unshift(...loaders);
}

import ko from 'knockout';
import { reactBindingHandler } from './bindings/react';
import { routerBindingHandler } from './bindings/router';
import { datepickerComponent } from './components/datepicker';
import { mainComponent } from './components/main';
import { localStorageSync } from './extenders/local-storage-sync';
import { storeSync } from './extenders/store-sync';
import { storeSyncArray } from './extenders/store-sync-array';
import { lazyComponentLoader } from './loaders/lazy-component';
import { AppViewModel } from './models/app';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

// apply extenders
ko.extenders.storeSync = storeSync;
ko.extenders.storeSyncArray = storeSyncArray;
ko.extenders.localStorageSync = localStorageSync;

// apply loaders
ko.components.loaders.unshift(lazyComponentLoader);

// apply knockout components
ko.components.register('main-component', mainComponent);
ko.components.register('datepicker-component', datepickerComponent);
ko.components.register('main-lazy-component', {
  lazy: () =>
    import('./components/main').then((res) => ({ default: res.mainComponent })),
});
ko.components.register('datepicker-lazy-component', {
  lazy: () =>
    import('./components/datepicker').then((res) => ({
      default: res.datepickerComponent,
    })),
});

// apply knockout bindings
ko.bindingHandlers['router'] = routerBindingHandler;
ko.bindingHandlers['reactMain'] = reactBindingHandler;
ko.bindingHandlers['reactDatepicker'] = reactBindingHandler;

// apply knockout async rendering
ko.options.deferUpdates = true;

// apply bindings for app viewModel
ko.applyBindings(new AppViewModel(rootElement), rootElement);
// we can also add more view models to other elements by id, but this elements should not be nested

import ko from 'knockout';
import { reactBindingHandler } from './bindings/react';
import { routerBindingHandler } from './bindings/router';
import { datepickerComponent } from './components/datepicker';
import { mainComponent } from './components/main';
import { notFoundComponent } from './components/not-found';
import { localStorageSync } from './extenders/local-storage-sync';
import { storeSync } from './extenders/store-sync';
import { lazyComponentLoader } from './loaders/lazy-component';
import { AppViewModel } from './models/app';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

// apply custom extenders
ko.extenders.storeSync = storeSync;
ko.extenders.localStorageSync = localStorageSync;

// apply custom loaders
ko.components.loaders.unshift(lazyComponentLoader);

// apply custom knockout components
ko.components.register('not-found-component', notFoundComponent);
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

// apply custom knockout bindings
ko.bindingHandlers['router'] = routerBindingHandler;
ko.bindingHandlers['reactMain'] = reactBindingHandler;
ko.bindingHandlers['reactDatepicker'] = reactBindingHandler;

// apply knockout async rendering
ko.options.deferUpdates = true;

// apply all bindings for app view model
ko.applyBindings(new AppViewModel(), rootElement);

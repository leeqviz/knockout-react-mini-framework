import ko from 'knockout';
import './index.css';
import { reactBindingHandler } from './lib/bindings/react';
import { AppViewModel } from './lib/models/app';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

// apply react binding handlers to knockout
ko.bindingHandlers['reactMain'] = reactBindingHandler;
ko.bindingHandlers['reactDatepicker'] = reactBindingHandler;

// apply bindings for app viewModel
ko.applyBindings(new AppViewModel(), rootElement);
// we can also add more view models to other elements by id, but this elements should not be nested

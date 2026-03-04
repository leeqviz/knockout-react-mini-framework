import '@/index.css';
import ko from 'knockout';
import { AppViewModel } from './lib/models/app';
import { reactBindingHandler } from './utils/bindings/react';

ko.bindingHandlers['reactMain'] = reactBindingHandler;
ko.bindingHandlers['reactDatepicker'] = reactBindingHandler;

// Запускаем Knockout
ko.applyBindings(new AppViewModel());

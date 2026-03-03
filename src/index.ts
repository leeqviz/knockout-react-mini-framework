import ko from 'knockout';
import './index.css';
import { AppViewModel } from './lib/models/app';

import './lib/bindings/datepicker'; // Инициализируем наш мост для datepicker
import './lib/bindings/main'; // Инициализируем наш мост для main

// Запускаем Knockout
ko.applyBindings(new AppViewModel());

const a: any = 123;

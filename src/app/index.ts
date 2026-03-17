import { setupBindings } from './setup/bindings';
import { setupComponents } from './setup/components';
import { setupExtenders } from './setup/extenders';
import { setupLoaders } from './setup/loaders';
import { setupModels } from './setup/models';
import { setupOptions } from './setup/options';
import './styles/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

setupBindings(); // apply custom knockout bindings
setupComponents(); // apply custom knockout components
setupExtenders(); // apply custom knockout extenders
setupLoaders(); // apply custom knockout loaders
setupOptions(); // apply custom knockout options

setupModels(rootElement); // apply custom knockout models

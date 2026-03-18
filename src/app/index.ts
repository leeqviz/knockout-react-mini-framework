import { setupBindings } from './setup/bindings';
import { setupComponents } from './setup/components';
import { setupExtenders } from './setup/extenders';
import { setupLoaders } from './setup/loaders';
import { setupModels } from './setup/models';
import { setupOptions } from './setup/options';
import './styles/index.css';

// order is important
setupOptions(); // apply custom knockout options
setupLoaders(); // apply custom knockout loaders
setupExtenders(); // apply custom knockout extenders
setupBindings(); // apply custom knockout bindings
setupComponents(); // apply custom knockout components
setupModels(); // apply custom knockout models

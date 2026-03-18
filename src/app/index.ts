import {
  setupBindings,
  setupComponents,
  setupExtenders,
  setupLoaders,
  setupModels,
  setupOptions,
} from './setup';
import './styles/index.css';

// order is important
setupOptions(); // apply custom knockout options
setupLoaders(); // apply custom knockout loaders
setupExtenders(); // apply custom knockout extenders
setupBindings(); // apply custom knockout bindings
setupComponents(); // apply custom knockout components
setupModels(); // apply custom knockout models

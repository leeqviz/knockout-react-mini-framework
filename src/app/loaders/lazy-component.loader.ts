import { ko } from '@/shared/lib/ko';

export const lazyComponentLoader: KnockoutComponentTypes.Loader = {
  loadComponent: function (name, componentConfig, callback) {
    if (!componentConfig.lazy) {
      callback(null); // let the default loader do its job
      return;
    }

    // Resolving lazy component
    componentConfig
      .lazy()
      .then((module) => {
        if (!module.default) {
          console.error(`Module ${name} has no default export`);
          callback(null);
          return;
        }
        // let the default loader do its job
        ko.components.defaultLoader.loadComponent?.(
          name,
          module.default,
          callback,
        );
      })
      .catch((err: unknown) => {
        console.error(`Error loading lazy component ${name}:`, err);
        callback(null);
        return;
      });
  },
};

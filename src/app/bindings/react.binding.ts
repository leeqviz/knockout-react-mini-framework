import { ko } from '@/shared/lib/ko';
import { isPlainObject } from '@/shared/utils/validators';
import { createElement, type ElementType } from 'react';
import { createRoot, type Root } from 'react-dom/client';

// Extends HTMLElement to add _reactRoot property
interface HTMLElementWithReactRoot extends HTMLElement {
  _reactRoot?: Root | undefined;
}

// Custom binding configuration
export interface ReactBindingOptions<T = unknown> {
  component?: ElementType<T> | undefined;
  props?: (Record<string, unknown> & T) | undefined;
  deepUnwrap?: boolean | undefined; // for deep unwrapping of nested observables, if needed
}

function isReactBindingOptions(value: unknown): value is ReactBindingOptions {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  if ('deepUnwrap' in obj && typeof obj['deepUnwrap'] !== 'boolean') {
    return false;
  }

  if ('props' in obj && !isPlainObject(obj['props'])) {
    return false;
  }

  if ('component' in obj && obj['component'] === null) {
    return false;
  }

  return true;
}

export const reactBindingHandler: KnockoutBindingHandler = {
  // This method is called when the binding is first applied to an element. It sets up the React root and ensures cleanup when the element is removed.
  init: function (element: HTMLElementWithReactRoot) {
    // Create a React root and store it on the DOM element for later use in updates and cleanup
    element._reactRoot = createRoot(element);

    // Prevents possible memory leaks by unmounting the React component when the DOM node is removed by Knockout
    ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
      if (element._reactRoot) {
        element._reactRoot.unmount();
        Reflect.deleteProperty(element, '_reactRoot');
      } else {
        console.warn(
          'Attempted to unmount React root, but it was not found on element:',
          element,
        );
      }
    });

    // Prevents Knockout from control binding descendants of this element, since React will be managing the entire subtree
    return { controlsDescendantBindings: true };
  },

  // Render React component with new props whenever the observable changes
  update: function (
    element: HTMLElementWithReactRoot,
    valueAccessor: () => unknown,
  ) {
    // Unwrap binding configuration
    const value = ko.unwrap(valueAccessor());
    if (!isReactBindingOptions(value)) {
      console.warn('Invalid React binding configuration:', value);
      return;
    }

    const { component, props, deepUnwrap } = value;
    if (!component) {
      console.warn(
        'React component was not provided for element binding:',
        element,
      );
      return;
    }

    const cleanProps: Record<string, unknown> = {};
    // Deep unwrap allows us to pass complex nested structures (like objects or arrays) as clean props without keeping Knockout reactivity logic inside them
    if (props) {
      for (const key in props) {
        cleanProps[key] = deepUnwrap
          ? ko.toJS(props[key])
          : ko.unwrap(props[key]);
      }
    }

    // Attempt to render the React component with the new props
    if (element._reactRoot) {
      element._reactRoot.render(createElement(component, cleanProps));
    } else {
      console.warn('React root was not found for element binding:', element);
    }
  },
};

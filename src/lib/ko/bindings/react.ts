import { createElement, type ElementType } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ko } from '../globals';

// Extends HTMLElement to add _reactRoot property
interface ReactRootHTMLElement extends HTMLElement {
  _reactRoot?: Root | undefined;
}

// Custom binding configuration
interface ReactBindingOptions {
  component?: ElementType | undefined;
  props?: Record<string, unknown> | undefined;
  deepUnwrap?: boolean | undefined; // for deep unwrapping of nested observables, if needed
}

export const reactBindingHandler: KnockoutBindingHandler = {
  // This method is called when the binding is first applied to an element. It sets up the React root and ensures cleanup when the element is removed.
  init: function (element: ReactRootHTMLElement) {
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
    element: ReactRootHTMLElement,
    valueAccessor: () => ReactBindingOptions,
  ) {
    // Unwrap binding configuration
    const { component, props, deepUnwrap } = ko.unwrap(valueAccessor());

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
    if (element._reactRoot && component) {
      element._reactRoot.render(createElement(component, cleanProps));
    } else {
      console.warn('React component or root not found for element:', element);
    }
  },
};

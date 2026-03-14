import { ko } from '../globals';

export const ApplicationEvent = {
  REACT_COMPONENT_RENDER: 'react/component-render',
  TEST: 'test',
} as const;

export interface ApplicationEventPayloadMap {
  [ApplicationEvent.REACT_COMPONENT_RENDER]: { name: string };
  [ApplicationEvent.TEST]: string;
}

// get ApplicationEvent values as type union because ApplicationEvent has not only one key
export type ApplicationEventName =
  (typeof ApplicationEvent)[keyof typeof ApplicationEvent];

// additional helper for type-safety
// example: ApplicationEventPayloadOf<typeof ApplicationEvent.REACT_COMPONENT_RENDER>
export type ApplicationEventPayloadOf<T extends ApplicationEventName> =
  ApplicationEventPayloadMap[T];

export class ApplicationEventBus {
  private static instance: ApplicationEventBus | null;
  private dispatcher: KnockoutSubscribable<unknown>;

  private constructor() {
    this.publish = this.publish.bind(this);
    this.subscribe = this.subscribe.bind(this);

    this.dispatcher = new ko.subscribable<unknown>();
  }

  public static getInstance() {
    if (!ApplicationEventBus.instance) {
      ApplicationEventBus.instance = new ApplicationEventBus();
    }
    return ApplicationEventBus.instance;
  }

  public publish<T extends ApplicationEventName>(
    event: T,
    payload: ApplicationEventPayloadMap[T],
  ): void {
    this.dispatcher.notifySubscribers(payload, event);
  }

  public subscribe<T extends ApplicationEventName>(
    event: T,
    callback: (payload: ApplicationEventPayloadMap[T]) => void,
    target?: unknown,
  ): KnockoutSubscription {
    return this.dispatcher.subscribe(callback, target, event);
  }
}

export const appEventBus = ApplicationEventBus.getInstance();

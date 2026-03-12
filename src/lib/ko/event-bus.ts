import { ko } from '@/lib/ko/globals';

export interface ApplicationEventMap {
  REACT_COMPONENT_READY: { componentId: string };
}

export type ApplicationEventName = keyof ApplicationEventMap;

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
    payload: ApplicationEventMap[T],
  ): void {
    this.dispatcher.notifySubscribers(payload, event);
  }

  public subscribe<T extends ApplicationEventName>(
    event: T,
    callback: (payload: ApplicationEventMap[T]) => void,
    target?: unknown,
  ): KnockoutSubscription {
    return this.dispatcher.subscribe(callback, target, event);
  }
}

export const appEventBus = ApplicationEventBus.getInstance();

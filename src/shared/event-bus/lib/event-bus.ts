import ko from 'knockout';

export class BaseEventBus<TEventPayloadMap extends Record<string, unknown>> {
  protected dispatcher: KnockoutSubscribable<unknown>;

  protected constructor() {
    this.dispatcher = new ko.subscribable<unknown>();
  }

  public publish = <TEvent extends keyof TEventPayloadMap & string>(
    event: TEvent,
    payload: TEventPayloadMap[TEvent],
  ): void => {
    this.dispatcher.notifySubscribers(payload, event);
  };

  public subscribe = <TEvent extends keyof TEventPayloadMap & string>(
    event: TEvent,
    callback: (payload: TEventPayloadMap[TEvent]) => void,
    target?: unknown,
  ): KnockoutSubscription => {
    return this.dispatcher.subscribe(callback, target, event);
  };
}

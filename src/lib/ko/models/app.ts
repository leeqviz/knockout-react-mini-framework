import { appStore, type AppState } from '@/stores/app';
import type { User } from '@/types/user';
import {
  appEventBus,
  ApplicationEvent,
  type ApplicationEventPayloadMap,
} from '../event-bus';
import {
  ko,
  type KnockoutObservableArrayWithDispose,
  type KnockoutObservableWithDispose,
} from '../globals';
import { appRouter, type ApplicationRouter } from '../router';

// ViewModel as a shell for the entire application
export class AppViewModel {
  // Observable global variables
  public count: KnockoutObservableWithDispose<number>;
  public date: KnockoutObservableWithDispose<string>;
  public users: KnockoutObservableArrayWithDispose<User>;
  public theme: KnockoutObservableWithDispose<'light' | 'dark'>;
  public result: KnockoutComputed<string>;

  private eventSubscription: KnockoutSubscription;

  // client side routing
  public appRouter: ApplicationRouter;

  constructor() {
    // Initialize observables with default values
    this.count = ko.observable<number>(appStore.getState().count).extend({
      storeSync: {
        store: appStore,
        selector: (state: AppState) => state.count,
        setter: (newCount: number) => appStore.getState().setCount(newCount),
      },
    });
    this.date = ko.observable<string>(appStore.getState().date).extend({
      storeSync: {
        store: appStore,
        selector: (state: AppState) => state.date,
        setter: (newDate: string) => appStore.getState().setDate(newDate),
      },
    });
    this.users = ko.observableArray(appStore.getState().users).extend({
      storeSync: {
        store: appStore,
        selector: (state: AppState) => state.users,
        setter: (newUser: string) => appStore.getState().addUser(newUser),
      },
    });

    this.theme = ko.observable(appStore.getState().theme).extend({
      storeSync: {
        store: appStore,
        selector: (state: AppState) => state.theme,
        setter: (newTheme: 'light' | 'dark') =>
          appStore.getState().setTheme(newTheme),
      },
    });

    // Subscribe to the event from react
    this.eventSubscription = appEventBus.subscribe(
      ApplicationEvent.REACT_COMPONENT_RENDER,
      this.logToConsole,
      this,
    );
    this.appRouter = appRouter;
    this.appRouter.start();

    // Pure Computed observable is better than computed observable
    this.result = ko.pureComputed(() => this.count() + ' ' + this.date());

    // Important because we can put these methods in react components as props
    this.setCount = this.setCount.bind(this);
    this.setDate = this.setDate.bind(this);
    this.addUser = this.addUser.bind(this);
    this.logToConsole = this.logToConsole.bind(this);
    this.dispose = this.dispose.bind(this);
  }

  public dispose() {
    this.theme.dispose?.();
    this.count.dispose?.();
    this.date.dispose?.();
    this.users.dispose?.();

    this.eventSubscription.dispose();
    appRouter.dispose();
  }

  private logToConsole(
    payload: ApplicationEventPayloadMap['react/component-render'],
  ) {
    console.log(`Component is ready: ${payload.name}`);
  }

  public setCount(value: number) {
    this.count(value);
  }

  public setDate(value: string) {
    this.date(value);
  }

  public addUser() {
    appStore.getState().addUser('Knockout User');
  }
}

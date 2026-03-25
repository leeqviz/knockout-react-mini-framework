import { appRouter, type AppRouter } from '@/app/router';
import {
  AppEvent,
  appEventBus,
  type AppEventPayloadMap,
} from '@/shared/event-bus';
import {
  type KnockoutObservableArrayWithDispose,
  type KnockoutObservableWithDispose,
} from '@/shared/lib/ko';
import { appStore, type AppState } from '@/shared/store';
import type { Theme, User } from '@/shared/types';
import ko from 'knockout';
import { BaseViewModel } from './base.model';

interface ComponentBindingOptions {
  name: string;
  params: { withRouter: boolean };
}

// ViewModel as a shell for the entire application
export class AppViewModel extends BaseViewModel {
  // Observable global variables
  public count: KnockoutObservableWithDispose<number>;
  public date: KnockoutObservableWithDispose<string>;
  public users: KnockoutObservableArrayWithDispose<User>;
  public theme: KnockoutObservableWithDispose<Theme>;
  public result: KnockoutComputed<string>;

  private eventSubscription: KnockoutSubscription;

  // client side routing
  public appRouter: AppRouter;
  public bindingOptions: KnockoutComputed<ComponentBindingOptions>;

  public constructor() {
    super();
    // Initialize observables with default values
    this.count = ko.observable<number>(appStore.getState().count).extend({
      zustandSync: {
        store: appStore,
        selector: (state: AppState) => state.count,
        setter: (newCount: number) => appStore.getState().setCount(newCount),
      },
    });
    this.date = ko.observable<string>(appStore.getState().date).extend({
      zustandSync: {
        store: appStore,
        selector: (state: AppState) => state.date,
        setter: (newDate: string) => appStore.getState().setDate(newDate),
      },
    });
    this.users = ko.observableArray(appStore.getState().users).extend({
      zustandSync: {
        store: appStore,
        selector: (state: AppState) => state.users,
        setter: (newUser: string) => appStore.getState().addUser(newUser),
      },
    });
    this.theme = ko.observable(appStore.getState().theme).extend({
      zustandSync: {
        store: appStore,
        selector: (state: AppState) => state.theme,
        setter: (newTheme: Theme) => appStore.getState().setTheme(newTheme),
      },
    });

    // Subscribe to the event from react
    this.eventSubscription = appEventBus.subscribe(
      AppEvent.REACT_COMPONENT_RENDER,
      this.logToConsole,
      this,
    );
    this.appRouter = appRouter;
    this.appRouter.start();
    this.bindingOptions = ko.pureComputed(
      (): ComponentBindingOptions => ({
        name: appRouter.currentComponent(),
        params: { withRouter: true },
      }),
    );

    // Pure Computed observable is better than computed observable
    this.result = ko.pureComputed(() => this.count() + ' ' + this.date());
  }

  public dispose = () => {
    this.theme.dispose?.();
    this.count.dispose?.();
    this.date.dispose?.();
    this.users.dispose?.();

    this.result.dispose();
    this.bindingOptions.dispose();

    this.eventSubscription.dispose();
    appRouter.dispose();
  };

  private logToConsole = (
    payload: AppEventPayloadMap['react/component-render'],
  ) => {
    console.log(`Component is ready: ${payload.name}`);
  };

  public setCount = (value: number) => {
    this.count(value);
  };

  public setDate = (value: string) => {
    this.date(value);
  };

  public addUser = () => {
    appStore.getState().addUser('Knockout User');
  };
}

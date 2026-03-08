import { appStore, type AppState } from '@/stores/app';
import type { User } from '@/types/user';
import { getCurrentISODate } from '@/utils/mappers/date';
import ko from 'knockout';
import { appEventBus, type ApplicationEventMap } from '../event-bus';

// ViewModel as a shell for the entire application
export class AppViewModel {
  // Observable global variables
  public globalCount: KnockoutObservable<number>;
  public globalDate: KnockoutObservable<string>;
  public globalUsers: KnockoutObservableArray<User>;
  public result: KnockoutComputed<string>;

  public theme: KnockoutObservable<'light' | 'dark'> & { dispose?: () => void };

  private eventSubscription: KnockoutSubscription;

  // CLIENT SIDE PROGRAMMING NAVIGATION
  public currentPageComponent: KnockoutObservable<string>;
  public currentRouteParams: KnockoutObservable<Record<string, unknown>>;

  constructor() {
    // Initialize observables with default values
    this.globalCount = ko.observable<number>(0);
    this.globalDate = ko.observable<string>(getCurrentISODate());
    this.globalUsers = ko.observableArray(appStore.getState().users).extend({
      storeSync: {
        store: appStore,
        selector: (state: AppState) => state.users,
        setter: (newUser: string) => appStore.getState().addUser(newUser),
      },
    });

    // Subscribe to the event from react
    this.eventSubscription = appEventBus.subscribe(
      'REACT_COMPONENT_READY',
      this.logToConsole,
      this,
    );

    // Pure Computed observable is better than computed observable
    this.result = ko.pureComputed(
      () => this.globalCount() + ' ' + this.globalDate(),
    );

    this.theme = ko.observable(appStore.getState().theme).extend({
      storeSync: {
        store: appStore,
        selector: (state: AppState) => state.theme,
        setter: (newTheme: 'light' | 'dark') =>
          appStore.getState().setTheme(newTheme),
      },
    });

    // CLIENT SIDE PROGRAMMING NAVIGATION
    this.currentPageComponent = ko.observable('main-component');
    this.currentRouteParams = ko.observable({});
    // Listening to browser history
    window.addEventListener('popstate', this.handlePopState);
    // route init
    this.handlePath(window.location.pathname);

    // Important because we can put these methods in react components as props
    this.setGlobalCount = this.setGlobalCount.bind(this);
    this.setGlobalDate = this.setGlobalDate.bind(this);
    this.addGlobalUser = this.addGlobalUser.bind(this);
    this.handlePath = this.handlePath.bind(this);
    this.navigate = this.navigate.bind(this);
    this.logToConsole = this.logToConsole.bind(this);
    this.handlePopState = this.handlePopState.bind(this);
    this.dispose = this.dispose.bind(this);
  }

  public dispose() {
    this.theme.dispose?.();
    this.eventSubscription.dispose();
    window.removeEventListener('popstate', this.handlePopState);
  }

  private logToConsole(payload: ApplicationEventMap['REACT_COMPONENT_READY']) {
    console.log(`Component is ready: ${payload.componentId}`);
  }

  public setGlobalCount(value: number) {
    this.globalCount(value);
  }

  public setGlobalDate(value: string) {
    this.globalDate(value);
  }

  public addGlobalUser() {
    appStore.getState().addUser('Knockout User');
  }

  private handlePopState() {
    this.handlePath(window.location.pathname);
  }

  // map path to component
  private handlePath(path: string) {
    const cleanPath = path.replace(/^\//, '');
    const segments = cleanPath.split('/');

    const page = segments[0] || 'home';
    const id = segments[1];

    switch (page) {
      case 'home':
        this.currentPageComponent('main-component');
        this.currentRouteParams({});
        break;
      case 'test':
        this.currentPageComponent('datepicker-component');
        this.currentRouteParams({ userId: id });
        break;
      default:
        this.currentPageComponent('not-found-component');
        this.currentRouteParams({});
        break;
    }
  }

  // program navigation without page reload
  public navigate(path: string) {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      this.handlePath(path);
    }
  }
}

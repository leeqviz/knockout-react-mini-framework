import { appEventBus, type ApplicationEventMap } from '@/lib/ko/event-bus';
import { appStore, type AppState } from '@/stores/app';
import type { RouteConfig } from '@/types/routing';
import type { User } from '@/types/user';
import ko from 'knockout';

// ViewModel as a shell for the entire application
export class AppViewModel {
  // Observable global variables
  public count: KnockoutObservable<number>;
  public date: KnockoutObservable<string>;
  public users: KnockoutObservableArray<User>;
  public result: KnockoutComputed<string>;

  public theme: KnockoutObservable<'light' | 'dark'> & { dispose?: () => void };

  private eventSubscription: KnockoutSubscription;
  private routes: RouteConfig[];

  // CLIENT SIDE PROGRAMMING NAVIGATION
  public currentPageComponent: KnockoutObservable<string>;
  public currentRouteParams: KnockoutObservable<Record<string, string>>;
  public currentPathname: KnockoutComputed<string>;
  public currentSearch: KnockoutComputed<string>;

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

    // Subscribe to the event from react
    this.eventSubscription = appEventBus.subscribe(
      'REACT_COMPONENT_READY',
      this.logToConsole,
      this,
    );

    // Pure Computed observable is better than computed observable
    this.result = ko.pureComputed(() => this.count() + ' ' + this.date());

    this.theme = ko.observable(appStore.getState().theme).extend({
      storeSync: {
        store: appStore,
        selector: (state: AppState) => state.theme,
        setter: (newTheme: 'light' | 'dark') =>
          appStore.getState().setTheme(newTheme),
      },
    });

    // CLIENT SIDE PROGRAMMING NAVIGATION
    this.routes = [
      // order is important
      { pattern: '/', component: 'main-component' },
      { pattern: '/test', component: 'datepicker-component', protected: true },
      /* { pattern: '/test/settings', component: 'users-settings-widget' }, 
        { pattern: '/test/:userId', component: 'user-profile-widget' },
        { pattern: '/test/:userId/posts/:postId', component: 'post-detail-widget' } */
    ];

    this.currentPageComponent = ko.observable('main-component');
    this.currentRouteParams = ko.observable({});
    // Listening to browser history
    window.addEventListener('popstate', this.handlePopState);
    // route init
    this.currentPathname = ko.pureComputed(() => '');
    this.currentSearch = ko.pureComputed(() => '');
    this.handlePath(window.location.pathname);

    // Important because we can put these methods in react components as props
    this.setCount = this.setCount.bind(this);
    this.setDate = this.setDate.bind(this);
    this.addUser = this.addUser.bind(this);
    this.handlePath = this.handlePath.bind(this);
    this.navigate = this.navigate.bind(this);
    this.setSearchParams = this.setSearchParams.bind(this);
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

  public setCount(value: number) {
    this.count(value);
  }

  public setDate(value: string) {
    this.date(value);
  }

  public addUser() {
    appStore.getState().addUser('Knockout User');
  }

  private handlePopState() {
    this.handlePath(window.location.pathname);
  }

  // map path to component
  private handlePath(fullPath: string) {
    const [path, queryString] = fullPath.split('?');
    if (path) {
      this.currentPathname = ko.pureComputed(() => path);
    }
    if (queryString) {
      this.currentSearch = ko.pureComputed(() => '?' + queryString);
    }
    const normalizedPath = path
      ? path.endsWith('/') && path.length > 1
        ? path.slice(0, -1)
        : path
      : '';
    const queryParams = queryString
      ? Object.fromEntries(new URLSearchParams(queryString))
      : {};

    for (const route of this.routes) {
      const paramNames: string[] = [];

      // Превращаем шаблон '/users/:userId' в регулярку '^\/users\/([a-zA-Z0-9_-]+)$'
      const regexPattern = route.pattern
        .replace(/:([^\\/]+)/g, (_, paramName) => {
          paramNames.push(paramName); // Запоминаем имя параметра ('userId')
          return '([a-zA-Z0-9_-]+)'; // Регулярка для захвата самого значения
        })
        .replace(/\//g, '\\/'); // Экранируем обычные слэши для Regex

      const regex = new RegExp(`^${regexPattern}$`);
      const match = normalizedPath.match(regex);

      if (match) {
        if (route.protected) {
          // Синхронно читаем статус прямо из Zustand
          const isAuth = appStore.getState().isAuth;

          if (!isAuth) {
            console.warn(
              `Доступ к ${fullPath} запрещен. Перенаправление на логин.`,
            );

            // Перенаправляем на /login и сохраняем исходный URL в query-параметрах
            const redirectUrl = encodeURIComponent(fullPath);
            this.navigate(`/login?redirectTo=${redirectUrl}`);

            return;
          }
        }

        // Если маршрут совпал, извлекаем значения (match[0] - это вся строка, значения идут с 1)
        const paramValues = match.slice(1);

        // Собираем динамические параметры в объект: { userId: '42' }
        const dynamicParams = paramNames.reduce(
          (acc, name, index) => {
            acc[name] = paramValues[index] || '';
            return acc;
          },
          {} as Record<string, string>,
        );

        // 4. МАГИЯ ЗДЕСЬ: Объединяем оба объекта параметров!
        const allParams = { ...queryParams, ...dynamicParams };

        // Обновляем состояние Knockout
        this.currentPageComponent(route.component);
        this.currentRouteParams(allParams);
        return; // Маршрут найден, выходим из функции
      }
    }

    this.currentPageComponent('not-found-component');
    this.currentRouteParams({ ...queryParams });
  }

  // program navigation without page reload
  public navigate(path: string, options?: { replace?: boolean | undefined }) {
    if (window.location.pathname !== path) {
      if (options?.replace) window.history.replaceState({}, '', path);
      else window.history.pushState({}, '', path);
      this.handlePath(path);
    }
  }

  public setSearchParams(newParams: Record<string, string>) {
    const url = new URL(window.location.href);

    // Обновляем нужные параметры
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, value);
      }
    });

    // Переходим по новому URL с опцией replace (чтобы не спамить историю)
    this.navigate(url.pathname + url.search, { replace: true });
  }
}

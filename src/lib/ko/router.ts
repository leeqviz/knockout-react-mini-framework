import { ko } from '@/lib/ko/globals';
import { appStore } from '@/stores/app';

export interface RouteConfig {
  pattern: string;
  component: string;
  protected?: boolean;
}

export class ApplicationRouter {
  private static instance: ApplicationRouter | null;

  private routes: RouteConfig[];
  public currentComponent: KnockoutObservable<string>;
  public currentParams: KnockoutObservable<Record<string, string>>;
  public currentPathname: KnockoutObservable<string>;
  public currentSearch: KnockoutObservable<string>;

  private constructor() {
    this.start = this.start.bind(this);
    this.dispose = this.dispose.bind(this);
    this.handlePopState = this.handlePopState.bind(this);
    this.navigate = this.navigate.bind(this);
    this.handlePath = this.handlePath.bind(this);
    this.setSearchParams = this.setSearchParams.bind(this);

    this.routes = [
      // order is important
      { pattern: '/', component: 'main-component' },
      { pattern: '/test', component: 'datepicker-component', protected: true },
      /* { pattern: '/test/settings', component: 'users-settings-widget' }, 
        { pattern: '/test/:userId', component: 'user-profile-widget' },
        { pattern: '/test/:userId/posts/:postId', component: 'post-detail-widget' } */
    ];
    this.currentComponent = ko.observable<string>('main-component');
    this.currentParams = ko.observable<Record<string, string>>({});
    this.currentPathname = ko.observable(window.location.pathname);
    this.currentSearch = ko.observable('');
  }

  public static getInstance() {
    if (!ApplicationRouter.instance) {
      ApplicationRouter.instance = new ApplicationRouter();
    }
    return ApplicationRouter.instance;
  }

  public start() {
    window.addEventListener('popstate', this.handlePopState);
    this.handlePath(window.location.pathname + window.location.search);
  }

  public dispose() {
    window.removeEventListener('popstate', this.handlePopState);
  }

  private handlePopState() {
    this.handlePath(window.location.pathname + window.location.search);
  }

  public navigate(path: string, options?: { replace?: boolean | undefined }) {
    if (window.location.pathname + window.location.search !== path) {
      if (options?.replace) window.history.replaceState({}, '', path);
      else window.history.pushState({}, '', path);
      this.handlePath(path);
    }
  }

  private handlePath(fullPath: string) {
    const [path, queryString] = fullPath.split('?');
    if (queryString) {
      this.currentSearch('?' + queryString);
    }

    const normalizedPath = path
      ? path.endsWith('/') && path.length > 1
        ? path.slice(0, -1)
        : path
      : '';
    this.currentPathname(normalizedPath);

    const queryParams = queryString
      ? Object.fromEntries(new URLSearchParams(queryString))
      : {};

    for (const route of this.routes) {
      const paramNames: string[] = [];

      const regexPattern = route.pattern
        .replace(/:([^\\/]+)/g, (_, paramName) => {
          paramNames.push(paramName);
          return '([a-zA-Z0-9_-]+)';
        })
        .replace(/\//g, '\\/');

      const regex = new RegExp(`^${regexPattern}$`);
      const match = normalizedPath.match(regex);

      if (match) {
        if (route.protected) {
          const isAuth = appStore.getState().isAuth;

          if (!isAuth) {
            console.warn(
              `Access to ${fullPath} is denied, user is not authenticated`,
            );

            const redirectUrl = encodeURIComponent(fullPath);
            this.navigate(`/login?redirectTo=${redirectUrl}`);

            return;
          }
        }

        const paramValues = match.slice(1);

        const dynamicParams = paramNames.reduce(
          (acc, name, index) => {
            acc[name] = paramValues[index] || '';
            return acc;
          },
          {} as Record<string, string>,
        );

        const allParams = { ...queryParams, ...dynamicParams };

        this.currentComponent(route.component);
        this.currentParams(allParams);
        return;
      }
    }

    this.currentComponent('not-found-component');
    this.currentParams({ ...queryParams });
  }

  public setSearchParams(newParams: Record<string, string>) {
    const url = new URL(window.location.href);

    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === undefined) url.searchParams.delete(key);
      else url.searchParams.set(key, value);
    });

    this.navigate(url.pathname + url.search, { replace: true });
  }
}

export const appRouter = ApplicationRouter.getInstance();

import type {
  NavigateOptions,
  RouteParams,
  SearchParamsPatch,
} from '@/lib/ko/router';

export interface RouterSnapshot {
  navigate: (path: string, options?: NavigateOptions) => void;
  params: RouteParams;
  searchParams: RouteParams;
  location: {
    pathname: string;
    search: string;
    state: unknown;
  };
  setSearchParams: (
    newParams: SearchParamsPatch,
    options?: NavigateOptions,
  ) => void;
}

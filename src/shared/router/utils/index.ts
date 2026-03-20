export {
  compareDeep,
  compareReference,
  compareShallow,
  resolveComparator,
} from './comparator';
export { generateHistoryKey, readHistoryState, wrapState } from './history';
export {
  applyQueryParamConfig,
  getRouteScore,
  getWildcardParamName,
  isWildcardSegment,
  matchRoute,
  matchSegments,
  rankRoutes,
  validateParams,
} from './matcher';
export { ResolveResultType } from './route';
export {
  applyScrollTarget,
  defaultScrollBehavior,
  scheduleScrollToFragment,
  scrollToFragment,
} from './scroll';
export {
  addBase,
  getCurrentFullPath,
  normalizeBase,
  normalizeFullPath,
  normalizePath,
  parseUrl,
  stripBase,
} from './url';

export {
  compareDeep,
  compareReference,
  compareShallow,
  resolveComparator,
} from './comparator';
export { generateHistoryKey, readHistoryState, wrapState } from './history';
export {
  applyQueryParamConfig,
  buildPathByRoute,
  getRouteScore,
  getWildcardParamName,
  isWildcardSegment,
  matchRoute,
  matchSegments,
  rankRoutes,
  validateParams,
} from './matcher';
export { handleResolveResult, runMiddlewares } from './middleware';
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
  normalizeInputPath,
  normalizePath,
  parseUrl,
  stripBase,
} from './url';

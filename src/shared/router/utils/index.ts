export {
  compareDeep,
  compareReference,
  compareShallow,
  resolveComparator,
} from './comparator';
export { isModifiedEvent } from './events';
export {
  generateHistoryStateKey,
  readHistoryState,
  wrapHistoryState,
} from './history';
export {
  applyQueryParamConfig,
  buildPath,
  getRouteScore,
  getWildcardParamName,
  isWildcardSegment,
  matchRoute,
  matchSegments,
  rankRoutes,
  validateParams,
} from './matcher';
export { handleResolveResult, runMiddlewares } from './middleware';
export {
  addBase,
  getFullPath,
  mapLocation,
  normalizeBase,
  normalizeFullPath,
  normalizePath,
  parseUrl,
  resolveTo,
  sanitizePath,
  stripBase,
  toPath,
} from './path';
export { AllowedURLProtocols } from './protocols';
export { ResolveResultType } from './route';
export {
  defaultScrollBehaviorResolver,
  scrollToFragment,
  scrollToTarget,
} from './scroll';

import type { StateCompareStrategy } from '../types';

export function compareReference(a: unknown, b: unknown): boolean {
  return a === b;
}

export function compareShallow(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);

  if (keysA.length !== keysB.length) return false;

  return keysA.every(
    (key) =>
      (b as Record<string, unknown>)[key] ===
      (a as Record<string, unknown>)[key],
  );
}

export function compareDeep(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return a === b;

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);

  if (keysA.length !== keysB.length) return false;

  return keysA.every((key) =>
    compareDeep(
      (a as Record<string, unknown>)[key],
      (b as Record<string, unknown>)[key],
    ),
  );
}

export function resolveComparator(
  strategy: StateCompareStrategy | undefined,
): (a: unknown, b: unknown) => boolean {
  if (!strategy || strategy === 'reference') return compareReference;
  if (strategy === 'shallow') return compareShallow;
  if (strategy === 'deep') return compareDeep;
  return strategy;
  /* custom
      if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return a === b;
      return (a as { id?: unknown }).id === (b as { id?: unknown }).id;
    */
}

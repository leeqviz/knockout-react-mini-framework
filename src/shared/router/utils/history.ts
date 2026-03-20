import type { InternalHistoryState } from '../types';

export function generateHistoryKey(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function wrapState(
  userState: unknown,
  key?: string,
): InternalHistoryState {
  return {
    __routerKey: key ?? generateHistoryKey(),
    data: userState,
  };
}

export function readHistoryState(raw: unknown): { key: string; data: unknown } {
  if (
    raw !== null &&
    typeof raw === 'object' &&
    '__routerKey' in (raw as object)
  ) {
    const entry = raw as InternalHistoryState;
    return { key: entry.__routerKey, data: entry.data };
  }
  return { key: generateHistoryKey(), data: raw };
}

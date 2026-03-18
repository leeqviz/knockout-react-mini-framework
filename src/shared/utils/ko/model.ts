import { ko } from '@/shared/lib/ko';

export function applyBindings<T = unknown>(
  model: new (...args: unknown[]) => T,
  elementId: string,
) {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`${elementId} element not found`);

  ko.applyBindings(new model(), element);
}

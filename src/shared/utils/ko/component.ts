import { ko } from '@/shared/lib/ko';

export function registerComponent<T = KnockoutComponentTypes.ViewModel>(
  componentName: string,
  config: KnockoutComponentTypes.Config<T> | KnockoutComponentTypes.EmptyConfig,
): void {
  if (ko.components.isRegistered(componentName)) {
    console.warn(
      `Component "${componentName}" is already registered. Unregistering...`,
    );
    ko.components.unregister(componentName);
  }
  ko.components.register(componentName, config);
}

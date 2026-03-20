import type { AppEvent } from '../utils';

// get AppEvent values as type union because AppEvent has not only one key
export type AppEventName = (typeof AppEvent)[keyof typeof AppEvent];

export type AppEventPayloadMap = {
  [AppEvent.REACT_COMPONENT_RENDER]: { name: string };
  [AppEvent.TEST]: string;
};

// additional helper for type-safety
// example: AppEventPayloadOf<typeof AppEvent.REACT_COMPONENT_RENDER>
export type AppEventPayloadOf<T extends AppEventName> = AppEventPayloadMap[T];

import { BaseEventBus } from './event-bus';
import type { AppEventPayloadMap } from './types';

export class AppEventBus extends BaseEventBus<AppEventPayloadMap> {
  private static instance: AppEventBus | null = null;

  private constructor() {
    super();
  }

  public static getInstance = (): AppEventBus => {
    if (!AppEventBus.instance) {
      AppEventBus.instance = new AppEventBus();
    }

    return AppEventBus.instance;
  };
}

export const appEventBus = AppEventBus.getInstance();

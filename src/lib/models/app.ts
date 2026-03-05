import { appStore } from '@/stores/app';
import type { User } from '@/types/user';
import { getCurrentISODate } from '@/utils/mappers/date';
import ko from 'knockout';

// ViewModel as a shell for the entire application
export class AppViewModel {
  // Observable global variables
  public globalCount: KnockoutObservable<number>;
  public globalDate: KnockoutObservable<string>;
  public globalUsers: KnockoutObservableArray<User>;

  constructor() {
    // Initialize observables with default values
    this.globalCount = ko.observable<number>(0);
    this.globalDate = ko.observable<string>(getCurrentISODate());
    this.globalUsers = ko.observableArray(appStore.getState().users);

    // Subscribe to the app store to keep Knockout state in sync with React state
    appStore.subscribe((newState, prevState) => {
      if (newState.users !== prevState.users) {
        // Update the Knockout observable array with the new users list from the store if it has changed outside of Knockout
        this.globalUsers(newState.users);
      }
    });

    // Important because we can put these methods in react components as props
    this.setGlobalCount = this.setGlobalCount.bind(this);
    this.setGlobalDate = this.setGlobalDate.bind(this);
    this.addGlobalUser = this.addGlobalUser.bind(this);
  }

  public setGlobalCount(value: number) {
    this.globalCount(value);
  }

  public setGlobalDate(value: string) {
    this.globalDate(value);
  }

  public addGlobalUser() {
    appStore.getState().addUser('New User');
  }
}

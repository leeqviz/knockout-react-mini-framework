import { appStore } from '@/stores/app';
import type { User } from '@/types/user';
import { getCurrentISODate } from '@/utils/mappers/date';
import ko from 'knockout';
import { DatepickerViewModel } from './datepicker';
import { MainViewModel } from './main';

// ViewModel as a shell for the entire application
export class AppViewModel {
  // Observable global variables
  globalCount: KnockoutObservable<number>;
  globalDate: KnockoutObservable<string>;
  globalUsers: KnockoutObservableArray<User>;

  // Components we want to render inside Knockout templates
  mainViewModel: MainViewModel;
  datepickerViewModel: DatepickerViewModel;

  constructor() {
    // Initialize observables with default values
    this.globalCount = ko.observable<number>(0);
    this.globalDate = ko.observable<string>(getCurrentISODate());
    this.globalUsers = ko.observableArray(appStore.getState().users);

    // Initialize components
    this.mainViewModel = new MainViewModel();
    this.datepickerViewModel = new DatepickerViewModel();

    // Subscribe to the app store to keep Knockout state in sync with React state
    appStore.subscribe((newState, prevState) => {
      if (newState.users !== prevState.users) {
        // Update the Knockout observable array with the new users list from the store if it has changed outside of Knockout
        this.globalUsers(newState.users);
      }
    });
  }

  setGlobalCount = (value: number) => {
    this.globalCount(value);
  };

  setGlobalDate = (value: string) => {
    this.globalDate(value);
  };

  addGlobalUser() {
    appStore.getState().addUser('New User');
  }
}

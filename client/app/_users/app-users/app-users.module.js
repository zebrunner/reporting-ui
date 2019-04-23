import appUsers from './app-users.directive';
import appUsersControls from './app-users-controls/app-users-controls.directive';

export const appUsersModule = angular.module('app.appUsers', [])
    .directive({ appUsers })
    .directive({ appUsersControls });

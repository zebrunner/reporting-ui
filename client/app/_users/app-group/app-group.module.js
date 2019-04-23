import appGroup from './app-group.directive';
import appGroupItem from './app-group-item/app-group-item.directive';

export const appGroupModule = angular.module('app.appGroup', [])
    .directive({ appGroup })
    .directive({ appGroupItem });

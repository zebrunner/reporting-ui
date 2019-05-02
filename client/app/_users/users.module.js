import usersComponent from './users.component';
import emptyPageComponent from '../shared/empty-page/empty-page.component';

export const usersModule = angular.module('app.users', [])
    .component({ emptyPageComponent })
    .component({ usersComponent });

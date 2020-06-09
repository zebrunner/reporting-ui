import usersComponent from './users.component';
import checkedListIcon from '../../assets/images/check_list.svg';

export const usersModule = angular.module('app.users', [])
    .component({ usersComponent })
    .config(($mdIconProvider) => {
        'ngInject';

        $mdIconProvider
            .icon('checkedListIcon', checkedListIcon)
    });

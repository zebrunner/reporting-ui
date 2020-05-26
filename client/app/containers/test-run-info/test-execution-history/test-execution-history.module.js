'use strict';

import testExecutionHistory from './test-execution-history.component';
import lambaIcon from '../../../../assets/images/lamba.svg';
import lambaBgIcon from '../../../../assets/images/lamba-bg.svg';

import './test-execution-history.scss';

export const testExecutionHistoryModule = angular.module('testExecutionHistory', [])
    .component({ testExecutionHistory })
    .config(function ($mdIconProvider) {
        'ngInject';

        $mdIconProvider
            .icon('lamba', lambaIcon)
            .icon('lamba-bg', lambaBgIcon);
    })
    .name;

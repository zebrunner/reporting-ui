'use strict';

import testExecutionHistory from './test-execution-history.component';
import TestExecutionHistoryService from './test-execution-history.service';
import lambaIcon from '../../../../assets/images/lamba.svg';
import lambaBgIcon from '../../../../assets/images/lamba-bg.svg';

import './test-execution-history.scss';

export const testExecutionHistoryModule = angular.module('testExecutionHistory', [])
    .service({ TestExecutionHistoryService })
    .component({ testExecutionHistory })
    .config(function ($mdIconProvider) {
        'ngInject';

        $mdIconProvider
            .icon('lamba', lambaIcon)
            .icon('lamba-bg', lambaBgIcon);
    })
    .name;

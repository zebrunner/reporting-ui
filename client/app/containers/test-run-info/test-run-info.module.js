'use strict';

import testRunInfoComponent from './test-run-info.component';
import elasticsearchService from './elasticsearch.service';
import checkedListIcon from '../../../assets/images/check_list.svg';
import { testExecutionHistoryModule } from './test-execution-history/test-execution-history.module';
import videocam_off_outlined from '../../../assets/images/videocam_off_outlined.svg';

export const testRunInfoModule = angular.module('app.testRunInfo', [testExecutionHistoryModule])
    .factory({ elasticsearchService })
    .component({ testRunInfoComponent })
    .config(($mdIconProvider) => {
        'ngInject';

        $mdIconProvider
            .icon('checkedListIcon', checkedListIcon)
            .icon('outlined:videocam_off', videocam_off_outlined);
    });

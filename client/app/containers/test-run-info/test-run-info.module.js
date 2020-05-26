'use strict';

import testRunInfoComponent from './test-run-info.component';
import elasticsearchService from './elasticsearch.service';
import checkedListIcon from '../../../assets/images/check_list.svg';
import videocam_off_outlined from '../../../assets/images/videocam_off_outlined.svg';

export const testRunInfoModule = angular.module('app.testRunInfo', [])
    .factory({ elasticsearchService })
    .component({ testRunInfoComponent })
    .config(($mdIconProvider) => {
        'ngInject';

        $mdIconProvider
            .icon('checkedListIcon', checkedListIcon)
            .icon('outlined:videocam_off', videocam_off_outlined);
    });

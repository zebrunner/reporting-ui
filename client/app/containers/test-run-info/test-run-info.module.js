'use strict';

import testRunInfoComponent from './test-run-info.component';
import elasticsearchService from './elasticsearch.service';
import checkedListIcon from '../../../assets/images/check_list.svg';
import videocam_off_outlined from '../../../assets/images/videocam_off_outlined.svg';
import arrowIcon from '../../../assets/images/_icons_test-info/icon_arrow.svg';
import bugIcon from '../../../assets/images/_icons_test-info/icon_bug.svg';
import clockIcon from '../../../assets/images/_icons_test-info/icon_clock.svg';
import deviceIcon from '../../../assets/images/_icons_test-info/icon_device.svg';
import flagIcon from '../../../assets/images/_icons_test-info/icon_flag.svg';
import layersIcon from '../../../assets/images/_icons_test-info/icon_layers.svg';
import linkIcon from '../../../assets/images/_icons_test-info/icon_link.svg';
import personIcon from '../../../assets/images/_icons_test-info/icon_person.svg';
import planetIcon from '../../../assets/images/_icons_test-info/icon_planet.svg';
import stopwatchIcon from '../../../assets/images/_icons_test-info/icon_stopwatch.svg';

export const testRunInfoModule = angular.module('app.testRunInfo', [])
    .factory({ elasticsearchService })
    .component({ testRunInfoComponent })
    .config(($mdIconProvider) => {
        'ngInject';

        $mdIconProvider
            .icon('checkedListIcon', checkedListIcon)
            .icon('outlined:videocam_off', videocam_off_outlined)
            .icon('arrowIcon', arrowIcon)
            .icon('bugIcon', bugIcon)
            .icon('clockIcon', clockIcon)
            .icon('deviceIcon', deviceIcon)
            .icon('flagIcon', flagIcon)
            .icon('layersIcon', layersIcon)
            .icon('linkIcon', linkIcon)
            .icon('personIcon', personIcon)
            .icon('planetIcon', planetIcon)
            .icon('stopwatchIcon', stopwatchIcon);
    });

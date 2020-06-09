'use strict';

import noVideoPlaceholderComponent from './no-video-placeholder/no-video-placeholder.component';
import testVideoSlider from './test-video-slider.component';
import videoSwiper from './video-swiper.directive';
import vncPlayer from './vnc-player.directive';
import videocamOffOutlined from '../../../../assets/images/videocam_off_outlined.svg';

import './test-video-slider.scss';

export const testVideoSliderModule = angular.module('testVideoSlider', [])

    .component({ noVideoPlaceholder: noVideoPlaceholderComponent })
    .component({ testVideoSlider })
    .directive({ videoSwiper })
    .directive({ vncPlayer })

    .config(($mdIconProvider) => {
        'ngInject';

        $mdIconProvider
            .icon('outlined:videocam_off', videocamOffOutlined);
    })

    .name;

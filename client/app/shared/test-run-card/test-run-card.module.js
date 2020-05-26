'use strict';

import testRunCard from './test-run-card.directive';
import blockerIcon from '../../../assets/images/_icons_test-run-card/icon_block.svg';
import reviewedIcon from '../../../assets/images/_icons_test-run-card/icon_reviewed.svg';
import commentIcon from '../../../assets/images/_icons_test-run-card/icon_comment.svg';

import './test-run-card.scss';

export const testRunCardModule = angular.module('testRunCard', [])
    .directive({ testRunCard })
    .config(function ($mdIconProvider) {
        'ngInject';

        $mdIconProvider
        .icon('blocker', blockerIcon)
        .icon('reviewed', reviewedIcon)
        .icon('comment', commentIcon);
    })
    .name;

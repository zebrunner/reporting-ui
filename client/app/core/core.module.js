'use strict';

import appCtrl from './app.controller';
import fullscreenLoader from '../shared/fullscreen-loader/fullscreen-loader.component';
import {CoreModuleRunner} from './core-module.runner';
import isOwner from '../shared/is-owner/is-owner.directive';
import infiniteScroll from '../shared/infinite-scroll/infinite-scroll.directive';
import blurFilter from '../shared/blur-filter/blur-filter.directive';

export const CoreModule = angular
    .module('appCore', [
        // Angular modules
        'ngAnimate',
        'ngAria',
        'ngMessages',
        'ngCookies',

        // 3rd Party Modules
        'ngMaterial',
        'ui.router',
        'duScroll',
        'angularMoment',
        'ngFileUpload',
    ])
    /**
     * Make UI Router wait for health checking and loading initial data
     */
    .config(function($urlRouterProvider) {
        'ngInject';

        $urlRouterProvider.deferIntercept();
    })
    .run(CoreModuleRunner)
    .component({ fullscreenLoader })
    .directive({ isOwner })
    .directive({ infiniteScroll })
    .directive({ blurFilter })
    .controller({ appCtrl })
    .name;

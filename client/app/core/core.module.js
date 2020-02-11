'use strict';

import appCtrl from './app.controller';
import fullscreenLoader from '../shared/fullscreen-loader/fullscreen-loader.component';
import {CoreModuleRunner} from './core-module.runner';

export const CoreModule = angular
    .module('appCore', [
        // Angular modules
        'ngAnimate',
        'ngAria',
        'ngMessages',
        'ngCookies',

        // Custom modules
        'app.layout',

        // 3rd Party Modules
        'ngMaterial',
        'ui.router',
        'duScroll',
        'angularMoment',
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
    .controller({ appCtrl })
    .name;

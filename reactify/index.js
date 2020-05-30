import angular from 'angular';
import ngReduxModule from 'ng-redux';
import { getStore } from '@zebrunner/core/store';

import { ZebrunnerReportingServicesModule } from './services';
import { SigninModule, PasswordForgotModule } from './containers';

import * as NgMaterial from 'angular-material';
import * as NgAnimate from 'angular-animate';
import * as NgMessages from 'angular-messages';

export * from './containers';

export const ZebrunnerReportingModule = angular.module('zebrunner.reporting', [
    NgMaterial,
    NgMessages,
    NgAnimate,
    ngReduxModule,
    SigninModule.name,
    PasswordForgotModule.name,
    ZebrunnerReportingServicesModule,
])

    .config(($ngReduxProvider) => {
        'ngInject';
        $ngReduxProvider.provideStore(getStore());
    })

    .name;

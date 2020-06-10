import angular from 'angular';
import ngReduxModule from 'ng-redux';
import { getStore } from '@zebrunner/core/store';

import { ReportingServicesModule } from './services';
import { SigninModule, PasswordForgotModule, PasswordResetModule, SignupModule } from './containers';

import * as NgMaterial from 'angular-material';
import * as NgAnimate from 'angular-animate';
import * as NgMessages from 'angular-messages';

export * from './containers';

export const ReportingModule = angular.module('zebrunner.reporting', [
    NgMaterial,
    NgMessages,
    NgAnimate,
    ngReduxModule,
    SigninModule.name,
    SignupModule.name,
    PasswordForgotModule.name,
    PasswordResetModule.name,
    ReportingServicesModule,
])

    .config(($ngReduxProvider) => {
        'ngInject';
        $ngReduxProvider.provideStore(getStore());
    })

    .name;

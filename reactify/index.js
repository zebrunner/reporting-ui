import angular from 'angular';
import ngReduxModule from 'ng-redux';

import { SigninModule } from './containers';
import { ZebrunnerReportingServicesModule } from './services';

export * from './containers';

export const ZebrunnerReportingModule = angular.module('zebrunner.reporting', [
    'ngMessages',
    'ngMaterial',
    ngReduxModule,
    SigninModule,
    ZebrunnerReportingServicesModule,
])

    .config(($ngReduxProvider) => {
        'ngInject';
        $ngReduxProvider.provideStore(getStore());
    })

    .name;

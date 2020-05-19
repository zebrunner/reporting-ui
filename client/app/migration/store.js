import angular from 'angular';
import ngReduxModule from 'ng-redux';
import { createZebrunnerStore, getStore } from '@zebrunner/core/store';

export const ZebrunnerReportingMigrationStoreModule = angular.module('zebrunner.reporting.migration.store', [
    ngReduxModule,
])

    .config(($ngReduxProvider) => {
        'ngInject';
        createZebrunnerStore();
        $ngReduxProvider.provideStore(getStore());
    })

    .name;

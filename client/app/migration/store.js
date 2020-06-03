import angular from 'angular';
import ngReduxModule from 'ng-redux';
import { createStore, getStore } from '@zebrunner/core/store';

export const ReportingMigrationStoreModule = angular.module('zebrunner.reporting.migration.store', [
    ngReduxModule,
])

    .config(($ngReduxProvider) => {
        'ngInject';
        createStore();
        $ngReduxProvider.provideStore(getStore());
    })

    .name;

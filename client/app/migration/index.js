import angular from 'angular';

import { ReportingMigrationServicesModule } from './services';
import { ReportingMigrationStoreModule } from './store';
import { ReportingMigrationSharedModule } from './shared';

export const ReportingMigrationModule = angular.module('zebrunner.reporting.migration', [
    ReportingMigrationServicesModule,
    ReportingMigrationStoreModule,
    ReportingMigrationSharedModule,
])
    .name;

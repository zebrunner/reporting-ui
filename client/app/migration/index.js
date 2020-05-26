import angular from 'angular';

import { ZebrunnerReportingMigrationServicesModule } from './services';
import { ZebrunnerReportingMigrationStoreModule } from './store';
import { ZebrunnerReportingMigrationSharedModule } from './shared';

export const ZebrunnerReportingMigrationModule = angular.module('zebrunner.reporting.migration', [
    ZebrunnerReportingMigrationServicesModule,
    ZebrunnerReportingMigrationStoreModule,
    ZebrunnerReportingMigrationSharedModule,
])
    .name;

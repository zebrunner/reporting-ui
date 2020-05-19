import angular from 'angular';

import { ZebrunnerReportingMigrationServicesModule } from './services';
import { ZebrunnerReportingMigrationStoreModule } from './store';

export const ZebrunnerReportingMigrationModule = angular.module('zebrunner.reporting.migration', [
    ZebrunnerReportingMigrationServicesModule,
    ZebrunnerReportingMigrationStoreModule,
])
    .name;

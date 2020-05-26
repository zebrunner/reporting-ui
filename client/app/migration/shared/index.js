import angular from 'angular';

import { AuthModule } from './auth/auth.module';

export const ZebrunnerReportingMigrationSharedModule = angular.module('zebrunner.reporting.migration.shared', [
    AuthModule,
])

    .name;

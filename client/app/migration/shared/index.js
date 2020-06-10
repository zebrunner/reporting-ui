import angular from 'angular';

import { AuthModule } from './auth/auth.module';

export const ReportingMigrationSharedModule = angular.module('zebrunner.reporting.migration.shared', [
    AuthModule,
])

    .name;

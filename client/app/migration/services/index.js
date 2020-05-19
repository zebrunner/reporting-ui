import angular from 'angular';

import { AuthService } from './auth.service';
import { RequestService } from './request.service';

export const ZebrunnerReportingMigrationServicesModule = angular.module('zebrunner.reporting.migration.services', [])

    .service({ AuthService })
    .service({ RequestService })

    .name;

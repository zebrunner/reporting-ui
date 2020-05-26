import angular from 'angular';

import { MigrationAuthService } from './migration-auth.service';
import { MigrationRequestService } from './migration-request.service';
import { SafeDigestService } from './safe-digest.service';

export const ZebrunnerReportingMigrationServicesModule = angular.module('zebrunner.reporting.migration.services', [])

    .service({ MigrationAuthService })
    .service({ MigrationRequestService })
    .service('$safeDigest', SafeDigestService)

    .name;

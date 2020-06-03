import angular from 'angular';

import { MigrationAuthService } from './migration-auth.service';
import { MigrationRequestService } from './migration-request.service';
import { SafeDigestService } from './safe-digest.service';
import { SnackbarService } from './snackbar.service';
import { ValidationsService } from './validations.service';

export const ReportingMigrationServicesModule = angular.module('zebrunner.reporting.migration.services', [])

    .service({ MigrationAuthService })
    .service({ MigrationRequestService })
    .service('$safeDigest', SafeDigestService)
    .service({ SnackbarService })
    .service({ ValidationsService })

    .name;

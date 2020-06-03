import angular from 'angular';

import { MigrationAuthService } from './migration-auth.service';
import { SafeDigestService } from '../../client/app/migration/services/safe-digest.service';
import { SnackbarService } from '../../client/app/migration/services/snackbar.service';
import { ValidationsService } from '../../client/app/migration/services/validations.service';
import { UsersService } from './users.service';
import { UtilService } from './util.service';

export const ReportingServicesModule = angular.module('zebrunner.reporting.services', [])

    .service({ SnackbarService })
    .service({ MigrationAuthService })
    .service('$safeDigest', SafeDigestService)
    .service({ ValidationsService })
    .service({ UsersService })
    .service({ UtilService })

    .name;

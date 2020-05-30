import angular from 'angular';

import { MigrationAuthService } from './migration-auth.service';
import { SafeDigestService } from '../../client/app/migration/services/safe-digest.service';
import { ShackbarService } from '../../client/app/migration/services/snackbar.service';
import { UsersService } from './users.service';
import { UtilService } from './util.service';

export const ZebrunnerReportingServicesModule = angular.module('zebrunner.reporting.services', [])

    .service({ ShackbarService })
    .service({ MigrationAuthService })
    .service('$safeDigest', SafeDigestService)
    .service({ UsersService })
    .service({ UtilService })

    .name;

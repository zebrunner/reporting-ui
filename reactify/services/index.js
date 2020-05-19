import angular from 'angular';

import { AuthService } from './auth.service';
import { RequestService } from './request.service';
import { UtilService } from './util.service';

export const ZebrunnerReportingServicesModule = angular.module('zebrunner.reporting.services', [])

    .service({ AuthService })
    .service({ RequestService })
    .service({ UtilService })

    .name;

import angular from 'angular';

import {
    UtilService,
} from './services';
import { SigninModule } from './containers';

export * from './containers';

export const ZebrunnerReportingModule = angular.module('zebrunner.reporting', [
    'ngMessages',
    'ngMaterial',
    SigninModule,
])

    .service({ UtilService })

    .name;

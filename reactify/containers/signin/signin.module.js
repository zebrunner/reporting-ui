import angular from 'angular';

import { AuthModule } from '../../../client/app/migration/shared/auth/auth.module';
import { signinComponent } from './signin.component';

export const SigninModule = angular.module('zebrunner.reporting.signin', [
    AuthModule,
])

    .component({ signinComponent });

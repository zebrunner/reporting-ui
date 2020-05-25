import angular from 'angular';

import { signinComponent } from './signin.component';
import { AuthModule } from '../../shared/auth';

export const SigninModule = angular.module('zebrunner.reporting.signin', [
    AuthModule,
])

    .component({ signinComponent });

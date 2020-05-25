import angular from 'angular';

import { passwordForgotComponent } from './password-forgot.component';
import { AuthModule } from '../../shared/auth';

export const PasswordForgotModule = angular.module('zebrunner.reporting.password-forgot', [
    AuthModule,
])

    .component({ passwordForgotComponent });

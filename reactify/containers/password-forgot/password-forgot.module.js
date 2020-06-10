import angular from 'angular';

import { AuthModule } from '../../../client/app/migration/shared/auth/auth.module';
import { passwordForgotComponent } from './password-forgot.component';

export const PasswordForgotModule = angular.module('zebrunner.reporting.password-forgot', [
    AuthModule,
])

    .component({ passwordForgotComponent });

import angular from 'angular';

import { AuthModule } from '../../../client/app/migration/shared/auth/auth.module';
import { signupComponent } from './signup.component';

export const SignupModule = angular.module('zebrunner.reporting.signup', [
    AuthModule,
])

    .component({ signupComponent });

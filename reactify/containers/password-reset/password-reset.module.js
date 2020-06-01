import angular from 'angular';

import { AuthModule } from '../../../client/app/migration/shared/auth/auth.module';
import { passwordResetComponent } from './password-reset.component';
import { identicalTo } from './identical-to.directive';

export const PasswordResetModule = angular.module('zebrunner.reporting.password-reset', [
    AuthModule,
])

    .directive({ identicalTo })
    .component({ passwordResetComponent });

import signupComponent from './signup.component';
import resetPasswordComponent from './reset-password.component';

export const authModule = angular.module('app.auth', [])
    .component({ signupComponent })
    .component({ resetPasswordComponent });

import signupComponent from './signup.component';
import signinComponent from './signin.component';
import forgotPasswordComponent from './forgot-password.component';
import resetPasswordComponent from './reset-password.component';
import loginSuccessComponent from './loginSuccess/login_success.component';

require('./bg-instance/bg-instance.module');
require('./copyright/copyright.module');

export const authModule = angular.module('app.auth', [
    'app.bgInstance',
    'app.copyright',
    ])
    .component({ loginSuccessComponent })
    .component({ signupComponent })
    .component({ signinComponent })
    .component({ resetPasswordComponent })
    .component({ forgotPasswordComponent });

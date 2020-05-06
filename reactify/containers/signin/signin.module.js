import angular from 'angular';
import { RouterModule } from '@zebrunner/core';

import { signinComponent } from './signin.component';
import { CopyrightModule } from '../../shared/copyright';
import { BackgroundModule } from './shared/background';

export const SigninModule = angular.module('zebrunner.signin', [
    CopyrightModule,
    BackgroundModule,
    RouterModule,
])

    .component({ signinComponent })

    .name;

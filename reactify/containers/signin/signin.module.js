import angular from 'angular';
import { signinComponent } from './signin.component';
import { CopyrightModule } from '../../shared/copyright';
import { BackgroundModule } from './shared/background';

export const SigninModule = angular.module('zebrunner.signin', [
    CopyrightModule,
    BackgroundModule,
])

    .component({ signinComponent })

    .name;

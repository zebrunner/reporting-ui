import angular from 'angular';
import { authComponent } from './auth.component';
import { CopyrightModule } from '../copyright/copyright.module';
import { BackgroundModule } from './shared/background/background.module';

export const AuthModule = angular.module('zebrunner.components.auth', [
    CopyrightModule,
    BackgroundModule
])

    .component({ authComponent })

    .name;

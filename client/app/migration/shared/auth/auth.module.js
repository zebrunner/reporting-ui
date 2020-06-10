import angular from 'angular';
import { CopyrightModule } from './shared/copyright/copyright.module';
import { BackgroundModule } from './shared/background/background.module';
import { authComponent } from './auth.component';

export const AuthModule = angular.module('zebrunner.shared.auth', [
    CopyrightModule,
    BackgroundModule
])

    .component({ authComponent })

    .name;

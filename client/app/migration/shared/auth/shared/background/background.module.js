import angular from 'angular';
import { backgroundComponent } from './background.component';

export const BackgroundModule = angular.module('zebrunner.shared.auth.background', [])

    .component({ backgroundComponent })

    .name;

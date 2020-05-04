import angular from 'angular';
import { backgroundComponent } from './background.component';

export const BackgroundModule = angular.module('zebrunner.signin.background', [])

    .component({ backgroundComponent })

    .name;

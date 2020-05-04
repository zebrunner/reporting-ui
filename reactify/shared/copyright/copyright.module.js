import angular from 'angular';
import { copyrightComponent } from './copyright.component';

export const CopyrightModule = angular.module('zebrunner.components.copyright', [])

    .component({ copyrightComponent })

    .name;

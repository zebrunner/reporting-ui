import angular from 'angular';
import { copyrightComponent } from './copyright.component';

export const CopyrightModule = angular.module('zebrunner.shared.auth.copyright', [])

    .component({ copyrightComponent })

    .name;

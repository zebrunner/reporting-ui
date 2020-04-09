'use strict';

import controller from './app-sidebar.controller';
import template from './app-sidebar.html';

const appSidebarDirective = function () {
    return {
        template,
        controller,
        controllerAs: '$ctrl',
        restrict: 'E',
        replace: true,
        bindToController: true
    };
};

export default appSidebarDirective;

'use strict';

import './app-sidebar.scss';
import appSidebarController from './app-sidebar.controller';
import appSidebarTemplate from './app-sidebar.html';

const appSidebarDirective = function() {
    return {
        template: appSidebarTemplate,
        controller: appSidebarController,
        controllerAs: '$ctrl',
        restrict: 'E',
        replace: true,
    };
};

export default appSidebarDirective;

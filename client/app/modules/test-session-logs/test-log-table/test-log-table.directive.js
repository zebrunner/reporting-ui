'use strict';

import controller from './test-log-table.controller';
import template from './test-log-table.html';

import './test-log-table.scss';

const testLogTableDirective = function testLogTableDirective() {
    return {
        template,
        controller,
        controllerAs: '$ctrl',
        restrict: 'E',
        replace: true,
        bindToController: true,
        scope: {
            logs: '<',
            withVisuals: '=',
            scrollableElemSelector: '<',
        },
    };
};

export default testLogTableDirective;

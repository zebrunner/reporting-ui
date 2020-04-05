'use strict';

import controller from './test-run-card.controller';
import template from './test-run-card.html';

const testRunCardDirective = function testRunCardDirective() {
    return {
        template,
        controller,
        scope: {
            singleMode: '=',
            testRun: '=',
            onSelect: '&',
            onDelete: '&',
            back: '&',
        },
        controllerAs: '$ctrl',
        restrict: 'E',
        replace: true,
        bindToController: true,
    };
};

export default testRunCardDirective;

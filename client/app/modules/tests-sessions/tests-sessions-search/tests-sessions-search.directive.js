'use strict';

import template from './tests-sessions-search.html';
import controller from './tests-sessions-search.controller';

import './tests-sessions-search.scss';

const testsSessionsSearchDirective = function testsSessionsSearchDirective() {
    return {
        template,
        controller,
        scope: {
            onSearch: '&',
            additionalSearchParams: '<',
        },
        controllerAs: '$ctrl',
        restrict: 'E',
        replace: true,
        bindToController: true,
        transclude:  true,
    };
};

export default testsSessionsSearchDirective;


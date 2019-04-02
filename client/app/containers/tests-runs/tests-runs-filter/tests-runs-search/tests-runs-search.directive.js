'use strict';

import template from './tests-runs-search.html';
import controller from './tests-runs-search.controller';

const testsRunsSearchDirective = function testsRunsSearchDirective() {
    return {
        template,
        controller,
        scope: {
            onFilterChange: '&'
        },
        controllerAs: '$ctrl',
        restrict: 'E',
        replace: true,
        bindToController: true,
        transclude:  true,
    };
};

export default testsRunsSearchDirective;


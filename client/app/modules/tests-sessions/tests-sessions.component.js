'use strict';

import template from './tests-sessions.html';
import controller from './tests-sessions.controller';

const testsSessionsComponent = {
    template,
    controller,
    bindings: {
        resolvedTestSessions: '<',
        additionalSearchParams: '<',
    },
    bindToController: true,
};

export default testsSessionsComponent;

'use strict';

import controller from './test-execution-history.controller';
import template from './test-execution-history.html';

const testExecutionHistoryComponent = {
    template,
    controller,
    bindings: {
        executionHistory: '<',
        activeTestId: '<',
        parentTestId: '<',
        onTestSelect: '&',
    },
};

export default testExecutionHistoryComponent;

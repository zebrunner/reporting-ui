import template from './test-session-logs.html';
import controller from './test-session-logs.controller';

import './test-session-logs.scss';

const testSessionLogsComponent = {
    template,
    controller,
    bindings: {
        testSession: '<',
    },
    bindToController: true,
};

export default testSessionLogsComponent;

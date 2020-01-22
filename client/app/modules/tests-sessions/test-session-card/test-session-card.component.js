import template from './test-session-card.html';
import controller from './test-session-card.controller';

import './test-session-card.scss';

const testSessionCardComponent = {
    template,
    controller,
    bindings: {
        testSession: '=',
        onSelect: '&',
    },
    bindToController: true,
};

export default testSessionCardComponent;

'use strict';

import template from './test-ticket.html';
import controller from './test-ticket.controller';

import './test-ticket.scss';

const testTicketComponent = {
    template,
    controller,
    bindings: {
        workItem: '<',
        jiraSettings: '<',
    }
};

export default testTicketComponent;

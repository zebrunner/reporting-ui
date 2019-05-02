'use strict';

import template from './empty-page.html';

const emptyPageComponent = {
    template,
    bindings: {
        content: '<',
    },
    bindToController: true,
};

export default emptyPageComponent;
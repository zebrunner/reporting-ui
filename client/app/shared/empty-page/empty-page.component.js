'use strict';

import template from './empty-page.html';

const emptyPageComponent = {
    template,
    bindings: {
        text: '@',
        buttonText: '@',
        page: '@',
        href: '@',
    },
    bindToController: true,
};

export default emptyPageComponent;
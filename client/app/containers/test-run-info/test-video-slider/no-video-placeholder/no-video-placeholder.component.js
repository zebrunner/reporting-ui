'use strict';

import template from './no-video-placeholder.html';

import './no-video-placeholder.scss';

const noVideoPlaceholderComponent = {
    template,
    bindings: {
        isVnc: '<',
    },
};

export default noVideoPlaceholderComponent;

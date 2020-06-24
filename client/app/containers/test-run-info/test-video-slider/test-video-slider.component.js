'use strict';

import controller from './test-video-slider.controller';
import template from './test-video-slider.html';

const testVideoSliderComponent = {
    template,
    controller,
    bindings: {
        drivers: '<',
        testStatus: '<',
        onDriverChange: '&?',
        activeSlideIndex: '<activeDriverIndex',
    },
};

export default testVideoSliderComponent;

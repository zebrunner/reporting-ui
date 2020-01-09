import template from './tutorials-slider.component.html';
import controller from './tutorials-slider.controller';

import './tutorials-slider.component.scss';

const tutorialsSliderComponent = {
    template,
    controller,
    bindings: {
        slides: '<',
        change: '&',
        slideIndex: '=',
    },
};

export default tutorialsSliderComponent;

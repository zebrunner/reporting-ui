import template from './signin.component.html';
import controller from './signin.controller';

export const signinComponent = {
    template,
    controller,
    bindings: {
        history: '<',
    },
};

import template from './copyright.component.html';
import controller from './copyright.controller';

export const copyrightComponent = {
    template,
    controller,
    bindings: {
        versions: '<',
    },
};

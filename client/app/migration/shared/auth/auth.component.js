import template from './auth.component.html';
import controller from './auth.controller';
import './auth.component.scss';

export const authComponent = {
    template,
    controller,
    transclude: true,
    bindings: {
        tenantIcon: '<',
        versions: '<',
    },
};

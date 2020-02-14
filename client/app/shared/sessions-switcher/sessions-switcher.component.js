import template from './sessions-switcher.component.html';
import controller from './sessions-switcher.controller';

import './sessions-switcher.component.scss';

const sessionSwitcherComponent = {
    template,
    controller,
    bindings: {
        switcherState: '=',
        onChange: '&',
        isDisabled: '<',
    }
}

export default sessionSwitcherComponent;

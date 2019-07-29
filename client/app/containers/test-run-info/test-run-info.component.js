import template from './test-run-info.html';
import controller from './test-run-info.controller';

const testRunInfoComponent = {
    template,
    controller,
    constrollerAs: '$ctrl', 
    bindings: {
        testRun: '<',
    },
    bindToController: true,
};

export default testRunInfoComponent;

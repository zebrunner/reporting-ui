import template from './test-run-info.html';
import controller from './test-run-info.controller';

const testRunInfoComponent = {
    template,
    controller,
    controllerAs: '$ctrl',
    bindings: {
        test: '<',
        testRun: '<',
        configSnapshot: '<',
    },
    bindToController: true,
};

export default testRunInfoComponent;

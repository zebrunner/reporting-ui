'use strict';

const progressbarService = function progressbarService($timeout) {
    'ngInject';

    let requestsCount = 0;

    function increaseRequestsCount() {
        requestsCount += 1;
    }

    function decreaseRequestsCount() {
        requestsCount && ($timeout(() => (requestsCount -= 1), 0));
    }

    return {
        decreaseRequestsCount,
        increaseRequestsCount,

        get isPending() { return !!requestsCount; }
    };
};

export default progressbarService;

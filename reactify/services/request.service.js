import { serverRequest } from '@zebrunner/core';

export function RequestService() {
    'ngInject';

    return {
        post,
    };

    function post(url, params) {
        return serverRequest(url, params);
    }
}

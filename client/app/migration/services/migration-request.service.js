import { getStore } from '@zebrunner/core/store';
import { getApplicationConfig } from '@zebrunner/core/store';

export const MigrationRequestService = ($httpMock) => {
    'ngInject'

    return {
        post: request('post'),
        put: request('put'),
        patch: request('patch'),
        get: request('get'),
        delete: request('delete'),
    };

    function getApiUrl() {
        const state = getStore().getState();

        return getApplicationConfig(state).api;
    }

    function request(method) {
        return (url, ...params) => $httpMock[method](`${getApiUrl()}${url}`, ...params);
    }
}

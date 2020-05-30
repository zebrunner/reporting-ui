import { getStore } from '@zebrunner/core/store';
import { getApplicationConfig } from '@zebrunner/core/store';

export const MigrationRequestService = ($httpMock) => {
    'ngInject'

    return {
        post,
    };

    function getUrl() {
        const state = getStore().getState();

        return getApplicationConfig(state).api;
    }

    function post(url, data) {
        return $httpMock.post(`${getUrl()}${url}`, data);
    }
}

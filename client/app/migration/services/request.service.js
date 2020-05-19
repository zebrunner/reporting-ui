import { left, right } from 'fp-ts/lib/Either';
import { getStore } from '@zebrunner/core/store';
import { getApplicationConfig } from '@zebrunner/core/build/cjs/store/application/selectors';

export const RequestService = ($httpMock) => {
    'ngInject'
    return {
        post,
        handleError,
    };

    function getUrl() {
        const state = getStore().getState();

        return getApplicationConfig(state).api;
    }

    function handleError(error) {
        if (error.status == 400 && error.data.validationErrors && error.data.validationErrors.length) {
            return res.data.validationErrors.map(validation => validation.message).join('\n');
        }

        return null;
    }

    function post(url, data) {
        return $httpMock.post(`${getUrl()}${url}`, data)
            .then(right)
            .catch(left);
    }
}

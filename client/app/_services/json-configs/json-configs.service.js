'use strict';

import languagesConfig from './languages-config.json';

const jsonConfigsService = function jsonConfigsService(
    $httpMock,
    UtilService,
    $q,
) {
    'ngInject';

    function fetchFile(url) {
        return $httpMock.get(`${url}?timestamp=${Date.now()}`);
    }

    function fetchProviderConfig(url) {
        return fetchFile(url).then(UtilService.handleSuccess, UtilService.handleError('Unable to get provider config'));
    }

    function getLanguagesConfig() {
        return $q.resolve(languagesConfig);
    }

    return {
        fetchFile,
        getLanguagesConfig,
        fetchProviderConfig,
    };
};

export default jsonConfigsService;

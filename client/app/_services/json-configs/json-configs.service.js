'use strict';

const jsonConfigsService = function jsonConfigsService(
    $httpMock,
    UtilService,
) {
    'ngInject';

    const languagesConfigUrl = 'https://zebrunner.s3-us-west-1.amazonaws.com/common/moon/snippets.json';

    function fetchFile(url) {
        return $httpMock.get(`${url}?timestamp=${Date.now()}`);
    }

    function fetchProviderConfig(url) {
        return fetchFile(url).then(UtilService.handleSuccess, UtilService.handleError('Unable to get provider config'));
    }

    function getLanguagesConfig() {
        return fetchFile(languagesConfigUrl).then(UtilService.handleSuccess, UtilService.handleError('Unable to fetch languages config'));
    }

    return {
        fetchFile,
        getLanguagesConfig,
        fetchProviderConfig,
    };
};

export default jsonConfigsService;

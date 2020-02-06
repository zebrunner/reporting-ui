'use strict';

const testSessionLogsService = function testSessionLogsService(
    $httpMock,
    API_URL,
    $httpParamSerializer,
    UtilService,
) {
    'ngInject';

    const sessionStorageURL = 'https://api.zebrunner.com/moon';
    const service = {
        getSessionLog,
        getSessionVideoURL,
        getSessionLogURL,
    };

    function getSessionLog(sessionId) {
        return $httpMock.get(getSessionLogURL(sessionId)).then(UtilService.handleSuccess, UtilService.handleError('Unable to fetch session log file'));
    }

    function getSessionLogURL(sessionId) {
        return `${sessionStorageURL}/${sessionId}/session.log`;
    }

    function getSessionVideoURL(sessionId) {
        return `${sessionStorageURL}/${sessionId}/video.mp4`;
    }

    return service;
};

export default testSessionLogsService;

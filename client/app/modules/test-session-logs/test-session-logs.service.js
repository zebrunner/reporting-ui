'use strict';

const testSessionLogsService = function testSessionLogsService(
    $httpMock,
    API_HOST,
    UtilService,
) {
    'ngInject';

    const sessionStorageURL = `${API_HOST}/moon`;
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

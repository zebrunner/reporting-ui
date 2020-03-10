'use strict';

const testsSessionsService = function testsSessionsService(
    $httpMock,
    API_URL,
    $httpParamSerializer,
    UtilService,
) {
    'ngInject';

    const DEFAULT_SC = {
        page: 0,
        pageSize: 20,
        orderBy: 'startedAt',
        sortOrder: 'DESC',
    };
    let lastParams = { ...DEFAULT_SC };
    const service = {
        DEFAULT_SC,
        searchSessions,
        resetCachedParams,
        fetchAdditionalSearchParams,
        getSessionById,
        refactorPlatformData,

        get activeParams() { return lastParams; },
        set activeParams(newSC) { lastParams = newSC; return true; },
    };

    function refactorPlatformData(data) {
        return [data.browserName.toLowerCase(), data.version];
    }

    function searchSessions(params = lastParams) {
        service.activeParams = params;

        return $httpMock.get(`${API_URL}/api/tests/sessions/search?${$httpParamSerializer(service.activeParams)}`).then(UtilService.handleSuccess, UtilService.handleError('Unable to search test sessions'));
    }

    function resetCachedParams() {
        service.activeParams = { ...DEFAULT_SC };
    }

    function fetchAdditionalSearchParams() {
        return $httpMock.get(`${API_URL}/api/tests/sessions/search/parameters`).then(UtilService.handleSuccess, UtilService.handleError('Unable to fetch additional sessions search params'));
    }

    function getSessionById(sessionId) {
        return $httpMock.get(`${API_URL}/api/tests/sessions/${sessionId}`).then(UtilService.handleSuccess, UtilService.handleError(`Unable to fetch test session with ID: ${sessionId}`));
    }

    return service;
};

export default testsSessionsService;

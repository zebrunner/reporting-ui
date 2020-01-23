'use strict';

const testsSessionsService = function testsSessionsService(
    $httpMock,
    API_URL,
    $httpParamSerializer,
    UtilService
) {
    'ngInject';

    const DEFAULT_SC = {
        page: 0,
        pageSize: 20,
    };
    let lastParams = {...DEFAULT_SC};
    const service = {
        DEFAULT_SC,
        searchSessions,
        resetCachedParams,
        fetchAdditionalSearchParams,

        get activeParams() { return lastParams; },
        set activeParams(newSC) { lastParams = newSC; return true; },
    };

    function searchSessions(params = lastParams) {
        service.activeParams = params;

        return $httpMock.get(`${API_URL}/api/tests/sessions/search?${$httpParamSerializer(service.activeParams)}`).then(UtilService.handleSuccess, UtilService.handleError('Unable to search test sessions'));
    }

    function resetCachedParams() {
        lastParams = {...DEFAULT_SC};
    }

    function fetchAdditionalSearchParams() {
        return $httpMock.get(`${API_URL}/api/tests/sessions/search/parameters`).then(UtilService.handleSuccess, UtilService.handleError('Unable to fetch additional sessions search params'));
    }

    return service;
};

export default testsSessionsService;

'use strict';

const testsSessionsService = function testsSessionsService(
    $httpMock,
    API_URL,
    $httpParamSerializer,
    UtilService,

    $q
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

        get activeParams() { return lastParams; },
        set activeParams(newSC) { lastParams = newSC; return true; },
    };

    function searchSessions(params = lastParams) {
        clearParams(params);
        service.activeParams = params;

        return $httpMock.get(`${API_URL}/api/tests/sessions/search?${$httpParamSerializer(service.activeParams)}`).then(UtilService.handleSuccess, UtilService.handleError('Unable to search test sessions'));
    }

    function resetCachedParams() {
        lastParams = {...DEFAULT_SC};
    }

    // remove empty properties from params object
    function clearParams(params) {
        Object.keys(params).forEach(property => {
            if (params[property] === '' || params[property] === undefined || params[property] === null) {
                Reflect.deleteProperty(params, property);
            }
        });
    }

    return service;
};

export default testsSessionsService;

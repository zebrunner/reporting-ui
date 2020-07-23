'use strict';

const appHealthService = function appHealthService(
    $httpMock,
) {
    'ngInject';

    let status = false;

    function checkServerStatus() {
        return $httpMock.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/status`, { transformResponse: [data => data] });
    }

    function changeHealthyStatus(newStatus) {
        return status = newStatus;
    }

    return {
        checkServerStatus,
        changeHealthyStatus,

        get isHealthy() { return status; },
    };
};

export default appHealthService;

'use strict';

const appHealthService = function appHealthService(
    $http,
    API_URL,
) {
    'ngInject';

    let status = false;

    function checkServerStatus() {
        return $http.get(`${API_URL}/api/status`, { transformResponse: [data => data] });
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

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

    return {
        checkServerStatus,

        get isHealthy() { return status; },
        set isHealthy(newStatus) { return status = newStatus; },
    };
};

export default appHealthService;

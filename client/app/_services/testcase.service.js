'use strict';

const testCaseService = function testCaseService(
    $httpMock,
    API_URL,
    UtilService,
) {
    'ngInject';

    return {
        getTestExecutionHistory,
    };

    function getTestExecutionHistory(testId, limit = 10) {
        return $httpMock.get(`${API_URL}/api/tests/${testId}/history?limit=${limit}`)
            .then(UtilService.handleSuccess, UtilService.handleError('Unable to get test execution history'));
    }
};

export default testCaseService;

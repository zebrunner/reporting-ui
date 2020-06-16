'use strict';

const TestExecutionHistoryService = function TestExecutionHistoryService(
    $httpMock,
    API_URL,
    UtilService,
) {
    'ngInject';

    return {
        addTimeDiffs,
        getTestExecutionHistory,
    };

    function getTestExecutionHistory(testId, limit = 10) {
        return $httpMock.get(`${API_URL}/api/tests/${testId}/history?limit=${limit}`)
            .then(UtilService.handleSuccess, UtilService.handleError('Unable to get test execution history'));
    }

    function addTimeDiffs(data) {
        const testsTimeMedian = median(data.filter((item) => item.status !== 'IN_PROGRESS')
            .map((item) => item.elapsed));

        return data.map((item) => {
            item.timeDiff = getTimeDiff(item.elapsed, testsTimeMedian);

            return item;
        });
    }

    function getTimeDiff(time = 0, testsTimeMedian = 0) {
        let diff = Math.floor(testsTimeMedian && time ?  time * 100 / testsTimeMedian : 0) - 100;

        // display only diffs with >= +100%
        if (diff >= 100) {
            return `+${Math.abs(diff)}%`;
        }

        return '';
    }

    function median(values){
        if (!values.length) { return 0; }

        const half = Math.floor(values.length / 2);

        values.sort((a = 0, b = 0) => a - b);
        if (values.length % 2) {
            return values[half];
        }

        return (values[half - 1] + values[half]) / 2;
    }

};

export default TestExecutionHistoryService;

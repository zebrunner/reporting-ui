(function () {
    'use strict';

    angular
        .module('app.services')
        .factory('TestService', ['$httpMock', '$rootScope', 'UtilService', TestService])

    function TestService($httpMock, $rootScope, UtilService) {
        const local = {
            tests: null,
            previousUrl: null,
        };
        const service = {
            searchTests,
            updateTest,
            getTestCaseWorkItemsByType,
            createTestWorkItem,
            createTestsWorkItems,
            deleteTestWorkItem,
            getJiraTicket,
            getConnectionToJira,
            subscribeOnLocationChangeStart,
            get tests() {
                return local.tests;
            },
            set tests(tests) {
                local.tests = tests;
            },
            getTest,
            clearDataCache,
            locationChange: null,
            clearPreviousUrl,
            getPreviousUrl,
            unsubscribeFromLocationChangeStart,
            updateTestsStatus,
        };

        return service;

        function subscribeOnLocationChangeStart() {
            service.locationChange = $rootScope.$on("$locationChangeStart", function (event, newUrl, oldUrl) {
                local.previousUrl = oldUrl;
            });
        }

        function getPreviousUrl() {
            return local.previousUrl;
        }

        function clearPreviousUrl() {
            local.previousUrl = null;
        }

        function unsubscribeFromLocationChangeStart() {
            if (service.locationChange) {
                service.locationChange();
            }
        }

        function getTest(id) {
            return local.tests.find(function(test) {
                return test.id == id;
            })
        }

        function clearDataCache() {
            local.tests = null;
        }

        function searchTests(criteria) {
            return $httpMock.post(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/tests/search`, criteria)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to search tests'));
        }

        function updateTest(test) {
            return $httpMock.put(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/tests`, test)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to update test'));
        }

        function getTestCaseWorkItemsByType(id, type) {
            return $httpMock.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/tests/${id}/workitem/${type}`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to get test work items by type'));
        }

        function createTestWorkItem(id, workItem) {
            return $httpMock.post(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/tests/${id}/workitem`, workItem)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to create test work item'));
        }

        function deleteTestWorkItem(testId, workItemId) {
            return $httpMock.delete(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/tests/${testId}/workitem/${workItemId}`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to delete test work item'));
        }

        function getJiraTicket(jiraId) {
            return $httpMock.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/tests/jira/${jiraId}`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to get issue from Jira'));
        }

        function getConnectionToJira() {
            return $httpMock.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/tests/jira/connect`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to get connection to Jira'));
        }

        /**
         * Bulk updates statuses
         * @param {Number} testRunId - ID of the test run which holds passed tests
         * @param {Object} ids - action params (array of tests IDs, action type and status value)
         * @returns {PromiseLike<any> | Promise<any>}
         */
        function updateTestsStatus(testRunId, params) {
            return $httpMock.patch(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/tests/runs/${testRunId}`, params)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to update statuses'));
        }

        /**
         * Bulk creates test workItems
         * @param {Number} testRunId - ID of the test run which holds passed tests
         * @param {Object[]} workItemsData - array of objects which hold test ID and array of workItem objects)
         * @returns {PromiseLike<any> | Promise<any>}
         */
        function createTestsWorkItems(testRunId, workItemsData) {
            return $httpMock.post(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/tests/runs/${testRunId}/workitems`, workItemsData)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to update statuses'));
        }
    }
})();

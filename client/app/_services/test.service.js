(function () {
    'use strict';

    angular
        .module('app.services')
        .factory('TestService', ['$httpMock', '$rootScope', 'UtilService', 'API_URL', TestService])

    function TestService($httpMock, $rootScope, UtilService, API_URL) {
        const local = {
            tests: null,
            previousUrl: null,
        };
        const service = {
            searchTests,
            updateTest,
            getTestCaseWorkItemsByType,
            createTestWorkItem,
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
            return $httpMock.post(API_URL + '/api/tests/search', criteria).then(UtilService.handleSuccess, UtilService.handleError('Unable to search tests'));
        }

        function updateTest(test) {
            return $httpMock.put(API_URL + '/api/tests', test).then(UtilService.handleSuccess, UtilService.handleError('Unable to update test'));
        }

        function getTestCaseWorkItemsByType(id, type) {
            return $httpMock.get(API_URL + '/api/tests/' + id + '/workitem/' + type).then(UtilService.handleSuccess, UtilService.handleError('Unable to get test work items by type'));
        }

        function createTestWorkItem(id, workItem) {
            return $httpMock.post(API_URL + '/api/tests/' + id + '/workitem', workItem).then(UtilService.handleSuccess, UtilService.handleError('Unable to create test work item'));
        }

        function deleteTestWorkItem(testId, workItemId) {
            return $httpMock.delete(API_URL + '/api/tests/' + testId + '/workitem/' + workItemId).then(UtilService.handleSuccess, UtilService.handleError('Unable to delete test work item'));
        }

        function getJiraTicket(jiraId) {
            return $httpMock.get(API_URL + '/api/tests/jira/' + jiraId).then(UtilService.handleSuccess, UtilService.handleError('Unable to get issue from Jira'));
        }

        function getConnectionToJira() {
            return $httpMock.get(API_URL + '/api/tests/jira/connect').then(UtilService.handleSuccess, UtilService.handleError('Unable to get connection to Jira'));
        }

        /**
         *
         * @param {Number[]} data - Array of IDs
         * @param {String} status
         * @returns {PromiseLike<any> | Promise<any>}
         */
        function updateTestsStatus(data = [], status = '') {
            const params = {
                ids: data,
                operation: 'STATUS_UPDATE',
                value: status,
            };

            return $httpMock.patch(API_URL + '/api/tests', params).then(UtilService.handleSuccess, UtilService.handleError('Unable to update statuses'));
        }
    }
})();

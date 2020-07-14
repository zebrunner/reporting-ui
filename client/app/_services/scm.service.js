(function() {
    'use strict';

    angular
        .module('app.services')
        .factory('ScmService', ['$http', '$location', 'UtilService', ScmService])

    function ScmService($http, $location, UtilService) {

        return {
            invitations: [],
            updateScmAccount,
            getGithubConfig,
            getAllScmAccounts,
            getDefaultBranch,
            deleteScmAccount,
            exchangeCode,
            getRepositories,
            getOrganizations,
        };

        function updateScmAccount(scmAccount) {
            return $http.put(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/scm/accounts`, scmAccount)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to create scm account'));
        }

        function getGithubConfig() {
            return $http.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/scm/github/config`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to get Github config'));
        }

        function getAllScmAccounts() {
            return $http.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/scm/accounts`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to get list of scm accounts'));
        }

        function getDefaultBranch(id) {
            return $http.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/scm/accounts/${id}/defaultBranch`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to get default branch'));
        }

        function deleteScmAccount(id) {
            return $http.delete(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/scm/accounts/${id}`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to delete repository'));
        }

        function getRepositories(id, org) {
            return $http.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/scm/github/repositories/${id}?org=${org}`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to get client id'));
        }

        function getOrganizations(id) {
            return $http.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/scm/github/organizations/${id}`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to get client id'));
        }

        function exchangeCode(code) {
            return $http.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/scm/github/exchange?code=${code}`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to get client id'));
        }
    }
})();

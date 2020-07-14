(function() {
    'use strict';

    angular
        .module('app.services')
        .factory('ScmService', ['$httpMock', '$location', 'UtilService', ScmService])

    function ScmService($httpMock, $location, UtilService) {

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
            return $httpMock.put(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/scm/accounts`, scmAccount)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to create scm account'));
        }

        function getGithubConfig() {
            return $httpMock.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/scm/github/config`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to get Github config'));
        }

        function getAllScmAccounts() {
            return $httpMock.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/scm/accounts`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to get list of scm accounts'));
        }

        function getDefaultBranch(id) {
            return $httpMock.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/scm/accounts/${id}/defaultBranch`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to get default branch'));
        }

        function deleteScmAccount(id) {
            return $httpMock.delete(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/scm/accounts/${id}`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to delete repository'));
        }

        function getRepositories(id, org) {
            return $httpMock.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/scm/github/repositories/${id}?org=${org}`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to get client id'));
        }

        function getOrganizations(id) {
            return $httpMock.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/scm/github/organizations/${id}`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to get client id'));
        }

        function exchangeCode(code) {
            return $httpMock.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/scm/github/exchange?code=${code}`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to get client id'));
        }
    }
})();

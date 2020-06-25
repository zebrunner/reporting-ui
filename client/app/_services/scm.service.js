(function() {
    'use strict';

    angular
        .module('app.services')
        .factory('ScmService', ['$http', '$location', 'UtilService', 'API_URL', ScmService])

    function ScmService($http, $location, UtilService, API_URL) {

        var service = {};

        service.invitations = [];

        service.updateScmAccount = updateScmAccount;
        service.getGithubConfig = getGithubConfig;
        service.getAllScmAccounts = getAllScmAccounts;
        service.getDefaultBranch = getDefaultBranch;
        service.deleteScmAccount = deleteScmAccount;
        service.exchangeCode = exchangeCode;
        service.getRepositories = getRepositories;
        service.getOrganizations = getOrganizations;

        return service;

        function updateScmAccount(scmAccount) {
            return $http.put(API_URL + '/api/scm/accounts', scmAccount).then(UtilService.handleSuccess, UtilService.handleError('Unable to create scm account'));
        };

        function getGithubConfig() {
            return $http.get(API_URL + '/api/scm/github/config')
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to get Github config'));
        }

        function getAllScmAccounts() {
            return $http.get(API_URL + '/api/scm/accounts').then(UtilService.handleSuccess, UtilService.handleError('Unable to get list of scm accounts'));
        };

        function getDefaultBranch(id) {
            return $http.get(API_URL + '/api/scm/accounts/' + id + '/defaultBranch').then(UtilService.handleSuccess, UtilService.handleError('Unable to get default branch'));
        };

        function deleteScmAccount(id) {
            return $http.delete(API_URL + '/api/scm/accounts/' + id).then(UtilService.handleSuccess, UtilService.handleError('Unable to delete repository'));
        }

        function getRepositories(id, org) {
            return $http.get(API_URL + '/api/scm/github/repositories/' + id + '?org=' + org).then(UtilService.handleSuccess, UtilService.handleError('Unable to get client id'));
        }

        function getOrganizations(id) {
            return $http.get(API_URL + '/api/scm/github/organizations/' + id).then(UtilService.handleSuccess, UtilService.handleError('Unable to get client id'));
        }

        function exchangeCode(code) {
            return $http.get(API_URL + '/api/scm/github/exchange?code=' + code).then(UtilService.handleSuccess, UtilService.handleError('Unable to get client id'));
        }

    }
})();

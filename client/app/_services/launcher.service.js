(function () {
    'use strict';

    angular
        .module('app.services')
        .factory('LauncherService', ['$httpMock', '$rootScope', 'UtilService', 'API_URL', LauncherService])

    function LauncherService($http, $rootScope, UtilService, API_URL) {

        var service = {};

        service.createLauncher = createLauncher;
        service.getLauncherById = getLauncherById;
        service.getAllLaunchers = getAllLaunchers;
        service.updateLauncher = updateLauncher;
        service.deleteLauncherById = deleteLauncherById;
        service.buildLauncher = buildLauncher;
        service.scanRepository = scanRepository;
        service.getBuildNumber = getBuildNumber;
        service.abortScanRepository = abortScanRepository;
        service.isScannerInProgress = isScannerInProgress;
        service.setFavouriteLauncher = setFavouriteLauncher;

        return service;

        function createLauncher(launcher, automationServerId) {
            return $http.post(`${API_URL}/api/launchers?automationServerId=${automationServerId}`, launcher).then(UtilService.handleSuccess, UtilService.handleError('Unable to create launcher'));
        }

        function getLauncherById(id) {
            return $http.get(API_URL + '/api/launchers/' + id).then(UtilService.handleSuccess, UtilService.handleError('Unable to get launcher'));
        }

        function getAllLaunchers() {
            return $http.get(API_URL + '/api/launchers').then(UtilService.handleSuccess, UtilService.handleError('Unable to get all launchers'));
        }

        function updateLauncher(launcher) {
            return $http.put(API_URL + '/api/launchers', launcher).then(UtilService.handleSuccess, UtilService.handleError('Unable to update launcher'));
        }

        function deleteLauncherById(id) {
            return $http.delete(API_URL + '/api/launchers/' + id).then(UtilService.handleSuccess, UtilService.handleError('Unable to delete launcher'));
        }

        function buildLauncher(launcher, providerId) {
            return $http.post(API_URL + '/api/launchers/build' + (providerId ? `?providerId=${providerId}` : ''), launcher).then(UtilService.handleSuccess, UtilService.handleError('Unable to build with launcher'));
        }

        function setFavouriteLauncher(id, params) {
            return $http.patch(`${API_URL}/api/launchers/${id}`, params).then(UtilService.handleSuccess, UtilService.handleError('Unable to update launcher parameter'));
        }

        function scanRepository(launcherScanner, automationServerId) {
            return $http.post(`${API_URL}/api/launchers/scanner?automationServerId=${automationServerId}`, launcherScanner).then(UtilService.handleSuccess, UtilService.handleError('Unable to scan repository'));
        }

        function getBuildNumber(queueItemUrl) {
            return $http.get(API_URL + '/api/launchers/build/number?queueItemUrl=' + queueItemUrl).then(UtilService.handleSuccess, UtilService.handleError('Unable to get build number'));
        }

        function abortScanRepository(buildNumber, scmAccountId, rescan) {
            return $http.delete(`${API_URL}/api/launchers/scanner/${buildNumber}?scmAccountId=${scmAccountId}&rescan=${rescan}`).then(UtilService.handleSuccess, UtilService.handleError('Unable to cancel repository scanning'));
        }

        function isScannerInProgress(buildNumber, scmAccountId, rescan) {
            return $http.get(`${API_URL}/api/launchers/scanner/${buildNumber}?scmAccountId=${scmAccountId}&rescan=${rescan}`).then(UtilService.handleSuccess, UtilService.handleError('Unable to check repository scanning state'));
        }
    }
})();

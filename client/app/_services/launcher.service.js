(function () {
    'use strict';

    angular
        .module('app.services')
        .factory('LauncherService', ['$httpMock', '$cookies', '$rootScope', '$httpParamSerializer', 'UtilService', 'API_URL', LauncherService])

    function LauncherService($http, $cookies, $rootScope, $httpParamSerializer, UtilService, API_URL) {

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

        return service;

        function createLauncher(launcher) {
            return $http.post(API_URL + '/api/launchers', launcher).then(UtilService.handleSuccess, UtilService.handleError('Unable to create launcher'));
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

        function buildLauncher(launcher) {
            return $http.post(API_URL + '/api/launchers/build', launcher).then(UtilService.handleSuccess, UtilService.handleError('Unable to build with launcher'));
        }

        function scanRepository(launcherScanner) {
            return $http.post(API_URL + '/api/launchers/scanner', launcherScanner).then(UtilService.handleSuccess, UtilService.handleError('Unable to scan repository'));
        }

        function getBuildNumber(queueItemUrl) {
            return $http.get(API_URL + '/api/launchers/build/number', queueItemUrl).then(UtilService.handleSuccess, UtilService.handleError('Unable to get build number'));
        }

        function abortScanRepository(buildNumber, scmAccountId, rescan) {
            const query = $httpParamSerializer({scmAccountId: scmAccountId, rescan: rescan});
            return $http.delete(API_URL + '/api/launchers/scanner/' + buildNumber + '?' + query).then(UtilService.handleSuccess, UtilService.handleError('Unable to scan repository'));
        }
    }
})();

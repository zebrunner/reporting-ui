(function () {
    'use strict';

    angular
        .module('app.services')
        .factory('LauncherService', ['$httpMock', '$rootScope', 'UtilService', LauncherService])

    function LauncherService($httpMock, $rootScope, UtilService) {

        return {
            abortScanRepository,
            buildLauncher,
            createLauncher,
            deleteLauncherById,
            deleteLauncherConfig,
            getAllLaunchers,
            getBuildNumber,
            getConfigHook,
            getLauncherById,
            isScannerInProgress,
            saveLauncherConfig,
            scanRepository,
            setFavouriteLauncher,
            updateLauncher,
            updateLauncherConfig,
        };

        function createLauncher(launcher, automationServerId) {
            return $httpMock.post(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/launchers?automationServerId=${automationServerId}`, launcher)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to create launcher'));
        }

        function saveLauncherConfig(launcherId, params) {
            return $httpMock.post(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/launchers/${launcherId}/presets`, params)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to save launcher config'));
        }

        function updateLauncherConfig(laucnherId, configId, params) {
            return $httpMock.put(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/launchers/${laucnherId}/presets/${configId}`, params)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to update launcher config'));
        }

        function deleteLauncherConfig(laucnherId, configId) {
            return $httpMock.delete(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/launchers/${laucnherId}/presets/${configId}`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to delete launcher config'));
        }

        function getConfigHook(laucnherId, configId) {
            return $httpMock.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/launchers/${laucnherId}/presets/${configId}/hook`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to get webhook'));
        }

        function getLauncherById(id) {
            return $httpMock.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/launchers/${id}`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to get launcher'));
        }

        function getAllLaunchers() {
            return $httpMock.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/launchers`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to get all launchers'));
        }

        function updateLauncher(launcher) {
            return $httpMock.put(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/launchers`, launcher)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to update launcher'));
        }

        function deleteLauncherById(id) {
            return $httpMock.delete(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/launchers/${id}`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to delete launcher'));
        }

        function buildLauncher(launcher, providerId) {
            return $httpMock.post(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/launchers/build${providerId ? `?providerId=${providerId}` : ''}`, launcher)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to build with launcher'));
        }

        function setFavouriteLauncher(id, params) {
            return $httpMock.patch(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/launchers/${id}`, params)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to update launcher parameter'));
        }

        function scanRepository(launcherScanner, automationServerId) {
            return $httpMock.post(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/launchers/scanner?automationServerId=${automationServerId}`, launcherScanner)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to scan repository'));
        }

        function getBuildNumber(queueItemUrl) {
            return $httpMock.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/launchers/build/number?queueItemUrl=${queueItemUrl}`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to get build number'));
        }

        function abortScanRepository(buildNumber, scmAccountId, rescan) {
            return $httpMock.delete(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/launchers/scanner/${buildNumber}?scmAccountId=${scmAccountId}&rescan=${rescan}`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to cancel repository scanning'));
        }

        function isScannerInProgress(buildNumber, scmAccountId, rescan) {
            return $httpMock.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/launchers/scanner/${buildNumber}/status?scmAccountId=${scmAccountId}&rescan=${rescan}`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to check repository scanning state'));
        }
    }
})();

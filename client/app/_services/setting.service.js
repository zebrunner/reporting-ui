(function () {
    'use strict';

    angular
        .module('app.services')
        .factory('SettingsService', ['$httpMock', 'UtilService', SettingsService])

    function SettingsService($httpMock, UtilService) {
        return {
            regenerateKey,
        };

        function regenerateKey() {
            return $httpMock.post(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/settings/key/regenerate`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to get tools'));
        }
    }
})();

(function () {
    'use strict';

    angular
        .module('app.services')
        .factory('SettingsService', ['$httpMock', '$rootScope', 'UtilService', SettingsService])

    function SettingsService($httpMock, $rootScope, UtilService) {
        var service = {};

        service.getCompanyLogo = getCompanyLogo;
        service.deleteSetting = deleteSetting;
        service.createSetting = createSetting;
        service.editSetting = editSetting;
        service.regenerateKey = regenerateKey;

        return service;

        function getCompanyLogo() {
            return $httpMock.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/settings/companyLogo`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to get company logo URL'));
        }

        function deleteSetting(id) {
            return $httpMock.delete(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/settings/${id}`)
                .then(UtilService.handleSuccess, UtilService.handleError(`Unable to delete setting #${id}`));
        }

        function createSetting(setting) {
            return $httpMock.post(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/settings`, setting)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to create setting'));
        }

        function editSetting(setting) {
            return $httpMock.put(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/settings`, setting)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to edit setting'));
        }

        function regenerateKey() {
            return $httpMock.post(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/settings/key/regenerate`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to get tools'));
        }
    }
})();

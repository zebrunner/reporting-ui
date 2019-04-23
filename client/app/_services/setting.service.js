(function () {
    'use strict';

    angular
        .module('app.services')
        .factory('SettingsService', ['$httpMock', '$cookies', '$rootScope', 'UtilService', 'API_URL', SettingsService])

    function SettingsService($httpMock, $cookies, $rootScope, UtilService, API_URL) {
        var service = {};

        service.getCompanyLogo = getCompanyLogo;
        service.deleteSetting = deleteSetting;
        service.createSetting = createSetting;
        service.editSetting = editSetting;
        service.regenerateKey = regenerateKey;

        return service;

        function getCompanyLogo() {
            return $httpMock.get(API_URL + '/api/settings/companyLogo').then(UtilService.handleSuccess, UtilService.handleError('Unable to get company logo URL'));
        }

        function deleteSetting(id) {
            return $httpMock.delete(API_URL + '/api/settings/' + id).then(UtilService.handleSuccess, UtilService.handleError('Unable to delete setting #' + id));
        }

        function createSetting(setting) {
            return $httpMock.post(API_URL + '/api/settings', setting).then(UtilService.handleSuccess, UtilService.handleError('Unable to create setting'));
        }

        function editSetting(setting) {
            return $httpMock.put(API_URL + '/api/settings', setting).then(UtilService.handleSuccess, UtilService.handleError('Unable to edit setting'));
        }

        function regenerateKey() {
            return $httpMock.post(API_URL + '/api/settings/key/regenerate').then(UtilService.handleSuccess, UtilService.handleError('Unable to get tools'));
        }
    }
})();

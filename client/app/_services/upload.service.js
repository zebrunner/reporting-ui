(function () {
    'use strict';

    angular
        .module('app.services')
        .factory('UploadService', ['$httpMock', '$rootScope', 'UtilService', 'API_URL', UploadService])

    function UploadService($httpMock, $rootScope, UtilService, API_URL) {
        var service = {};

        service.upload = upload;

        return service;

        function upload(multipartFile, type) {
            return $httpMock.post(API_URL + `/v1/assets?type=${type}&file=`, multipartFile, {headers: {'Content-Type': undefined}, transformRequest : angular.identity}).then(UtilService.handleSuccess, UtilService.handleError('Unable to upload photo'));
        }
    }
})();

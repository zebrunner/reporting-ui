(function () {
    'use strict';

    angular
        .module('app.services')
        .factory('UploadService', ['$httpMock', '$rootScope', 'UtilService', UploadService])

    function UploadService($httpMock, $rootScope, UtilService) {
        var service = {};

        service.upload = upload;

        return service;

        function upload(multipartFile, type) {
            const config = { headers: { 'Content-Type': undefined }, transformRequest : angular.identity };

            return $httpMock.post(`${$httpMock.apiHost}${$httpMock.reportingPath}/v1/assets?type=${type}&file=`, multipartFile, config)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to upload photo'));
        }
    }
})();

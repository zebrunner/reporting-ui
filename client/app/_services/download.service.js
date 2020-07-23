(function () {
    'use strict';

    angular
        .module('app.services')
        .factory('DownloadService', ['$httpMock', '$rootScope', 'UtilService', DownloadService])

    function DownloadService($httpMock, $rootScope, UtilService) {
        var service = {};

        service.download = download;
        service.plainDownload = plainDownload;
        service.check = check;

        return service;

        function download(filename) {
            return $httpMock.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/download?filename=${filename}`, { responseType:'arraybuffer' })
                .then((res) => ({ success: true, res }), UtilService.handleError(`Unable to download file '${filename}'`));
        }

        function plainDownload(url) {
            return $httpMock.get(url, { responseType: 'blob' })
                .then(function(res) {return {success: true, res: res}}, UtilService.handleError('Unable to download file'));
        };

        function check(filename) {
            return $httpMock.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/download/check?filename=${filename}`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to check file existing'));
        }
    }
})();

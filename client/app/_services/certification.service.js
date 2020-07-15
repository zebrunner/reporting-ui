(function () {
    'use strict';

    angular
        .module('app.services')
        .factory('CertificationService', ['$httpMock', '$rootScope', 'UtilService', CertificationService])

    function CertificationService($httpMock, $rootScope, UtilService) {
        var service = {};

        service.loadCertificationDetails = loadCertificationDetails;

        return service;

        function loadCertificationDetails(upstreamJobId, upstreamJobBuildNumber) {
            const params = { upstreamJobId, upstreamJobBuildNumber };

        	return $httpMock.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/certification/details`, { params })
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to load certification details'));
        }
    }
})();

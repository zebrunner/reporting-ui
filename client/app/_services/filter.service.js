(function () {
    'use strict';

    angular
        .module('app.services')
        .factory('FilterService', ['$httpMock', '$rootScope', 'UtilService', FilterService])

    function FilterService($httpMock, $rootScope, UtilService) {
        var service = {};

        service.createFilter = createFilter;
        service.getAllPublicFilters = getAllPublicFilters;
        service.updateFilter = updateFilter;
        service.deleteFilter = deleteFilter;
        service.getSubjectBuilder = getSubjectBuilder;

        return service;

        function createFilter(filter) {
            return $httpMock.post(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/filters`, filter)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to create filter'));
        }

        function getAllPublicFilters() {
            return $httpMock.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/filters/all/public`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to get public filters'));
        }

        function updateFilter(filter) {
            return $httpMock.put(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/filters`, filter)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to update filter'));
        }

        function deleteFilter(id) {
            return $httpMock.delete(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/filters/${id}`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to delete filter'));
        }

        function getSubjectBuilder(name) {
            return $httpMock.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/filters/${name}/builder`)
                .then(UtilService.handleSuccess, UtilService.handleError(`Unable to get ${name} builder`));
        }
    }
})();

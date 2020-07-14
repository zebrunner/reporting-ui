(function () {
    'use strict';

    angular
        .module('app.services')
        .factory('PermissionService', ['$httpMock', '$rootScope', 'UtilService', PermissionService])

    function PermissionService($httpMock, $rootScope, UtilService) {
        var service = {};

        service.createPermission = createPermission;
        service.getAllPermissions = getAllPermissions;
        service.updatePermission = updatePermission;
        service.deletePermission = deletePermission;

        return service;

        function createPermission(permission) {
            return $httpMock.post(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/permissions`, permission)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to create permission'));
        }

        function updatePermission(permission) {
            return $httpMock.put(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/permissions/`, permission)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to update permission'));
        }

        function getAllPermissions() {
            return $httpMock.get(`${$httpMock.apiHost}/api/iam/v1/permissions`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to get permissions list'));
        }

        function deletePermission(id) {
            return $httpMock.delete(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/permissions/${id}`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to delete permission'));
        }
    }
})();

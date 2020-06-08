(function () {
    'use strict';

    angular
        .module('app.services')
        .factory('PermissionService', ['$httpMock', '$rootScope', 'UtilService', 'API_URL', 'iam_API_URL', PermissionService])

    function PermissionService($httpMock, $rootScope, UtilService, API_URL, iam_API_URL) {
        var service = {};

        service.createPermission = createPermission;
        service.getAllPermissions = getAllPermissions;
        service.updatePermission = updatePermission;
        service.deletePermission = deletePermission;

        return service;

        function createPermission(permission) {
            return $httpMock.post(API_URL + '/api/permissions', permission).then(UtilService.handleSuccess, UtilService.handleError('Unable to create permission'));
        }

        function updatePermission(permission) {
            return $httpMock.put(API_URL + '/api/permissions/', permission).then(UtilService.handleSuccess, UtilService.handleError('Unable to update permission'));
        }

        function getAllPermissions() {
            return $httpMock.get(iam_API_URL + '/api/iam/v1/permissions').then(UtilService.handleSuccess, UtilService.handleError('Unable to get permissions list'));
        }

        function deletePermission(id) {
            return $httpMock.delete(API_URL + '/api/permissions/' + id).then(UtilService.handleSuccess, UtilService.handleError('Unable to delete permission'));
        }
    }
})();

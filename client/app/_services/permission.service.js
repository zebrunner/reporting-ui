(function () {
    'use strict';

    angular
        .module('app.services')
        .factory('PermissionService', ['$httpMock', '$rootScope', 'UtilService', 'API_URL', 'authService', PermissionService])

    function PermissionService($httpMock, $rootScope, UtilService, API_URL, authService) {
        var service = {};

        service.createPermission = createPermission;
        service.getAllPermissions = getAllPermissions;
        service.updatePermission = updatePermission;
        service.deletePermission = deletePermission;
        service.authData =  authService.authData;

        return service;

        function createPermission(permission) {
            return $httpMock.post(API_URL + '/api/permissions', permission).then(UtilService.handleSuccess, UtilService.handleError('Unable to create permission'));
        }

        function updatePermission(permission) {
            return $httpMock.put(API_URL + '/api/permissions/', permission).then(UtilService.handleSuccess, UtilService.handleError('Unable to update permission'));
        }

        function getAllPermissions() {
            return $httpMock.get(`${$httpMock.serviceUrl}/api/iam/v1/permissions`, {headers: {'Authorization':`${service.authData.authTokenType} ${service.authData.authToken}`}})
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to get permissions list'));
        }

        function deletePermission(id) {
            return $httpMock.delete(API_URL + '/api/permissions/' + id).then(UtilService.handleSuccess, UtilService.handleError('Unable to delete permission'));
        }
    }
})();

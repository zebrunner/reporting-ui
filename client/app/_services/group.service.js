(function () {
    'use strict';

    angular
        .module('app.services')
        .factory('GroupService', ['$httpMock', '$rootScope', 'UtilService', GroupService])

    function GroupService($httpMock, rootScope, UtilService) {
        let groups = [];

        var service = {
            createGroup,
            getGroup,
            getAllGroups,
            updateGroup,
            deleteGroup,
            get groups() {
                return groups;
            },
            set groups(data) {
                groups = data;
            }
        };

        return service;

        function createGroup(group){
            return $httpMock.post(`${$httpMock.serviceUrl}/api/iam/v1/groups`, group).then(UtilService.handleSuccess, UtilService.handleError('Failed to create group'));
        }

        function getGroup(id){
            return $httpMock.get(`${$httpMock.serviceUrl}/api/iam/v1/groups/${id}`).then(UtilService.handleSuccess, UtilService.handleError('Failed to get group'));
        }

        function getAllGroups(isPublic){
            return $httpMock.get(`${$httpMock.serviceUrl}/api/iam/v1/groups?public=${isPublic}`).then(UtilService.handleSuccess, UtilService.handleError('Failed to get groups'));
        }

        function updateGroup(group, id){
            return $httpMock.put(`${$httpMock.serviceUrl}/api/iam/v1/groups/${id}`, group).then(UtilService.handleSuccess, UtilService.handleError('Failed to update group'));
        }

        function deleteGroup(id){
            return $httpMock.delete(`${$httpMock.serviceUrl}/api/iam/v1/groups/${id}`).then(UtilService.handleSuccess, UtilService.handleError('Failed to delete group'));
        }
    }
})();

(function () {
    'use strict';

    angular
        .module('app.services')
        .factory('GroupService', ['$httpMock', '$rootScope', 'UtilService', 'iam_API_URL', GroupService])

    function GroupService($httpMock, rootScope, UtilService, iam_API_URL) {
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
            return $httpMock.post(`${iam_API_URL}/api/iam/v1/groups`, group).then(UtilService.handleSuccess, UtilService.handleError('Failed to create group'));
        }

        function getGroup(id){
            return $httpMock.get(`${iam_API_URL}/api/iam/v1/groups/${id}`).then(UtilService.handleSuccess, UtilService.handleError('Failed to get group'));
        }

        function getAllGroups(){
            return $httpMock.get(iam_API_URL + '/api/iam/v1/groups').then(UtilService.handleSuccess, UtilService.handleError('Failed to get groups'));
        }

        function updateGroup(group, id){
            return $httpMock.put(`${iam_API_URL}/api/iam/v1/groups/${id}`, group).then(UtilService.handleSuccess, UtilService.handleError('Failed to update group'));
        }

        function deleteGroup(id){
            return $httpMock.delete(`${iam_API_URL}/api/iam/v1/groups/${id}`).then(UtilService.handleSuccess, UtilService.handleError('Failed to delete group'));
        }
    }
})();

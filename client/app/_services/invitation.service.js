(function() {
    'use strict';

    angular
        .module('app.services')
        .factory('InvitationService', ['$httpMock', '$rootScope', '$state', '$httpParamSerializer', 'UtilService', 'UserService', 'authService', InvitationService])

    function InvitationService($httpMock, $rootScope, $state, $httpParamSerializer, UtilService, UserService, authService) {
        let invitations = [];
        const service = {
            invite,
            getInvitation,
            search,
            deleteInvitation,
            authData: authService.authData,
            get invitations() {
                return invitations;
            },
            set invitations(data) {
                invitations = data;
            }
        };

        return service;

        function invite(invitations) {
            return $httpMock.post(`${$httpMock.serviceUrl}/api/iam/v1/invitations`, invitations.invitationTypes, {headers: {'Authorization':`${service.authData.authTokenType} ${service.authData.authToken}`}})
                .then(UtilService.handleSuccess, UtilService.handleError('Failed to invite users'));
        }

        function getInvitation(token) {
            return $httpMock.get(`${$httpMock.serviceUrl}/api/iam/v1/invitations?token=${token}`, {headers: {'Authorization':`${service.authData.authTokenType} ${service.authData.authToken}`}})
                .then(UtilService.handleSuccess, UtilService.handleError('Failed to get user invitation'));
        }

        function search(sc) {
            const path = $httpParamSerializer({query: sc.query, page: sc.page, pageSize: sc.pageSize, orderBy: sc.orderBy, sortOrder: sc.sortOrder});

            return $httpMock.get(`${$httpMock.serviceUrl}/api/iam/v1/invitations?${path}`, {headers: {'Authorization':`${service.authData.authTokenType} ${service.authData.authToken}`}})
                .then(UtilService.handleSuccess, UtilService.handleError('Failed to search user invitations'));
        }

        function deleteInvitation(id) {
            return $httpMock.delete(`${$httpMock.serviceUrl}/api/iam/v1/invitations/${id}`, {headers: {'Authorization':`${service.authData.authTokenType} ${service.authData.authToken}`}})
                .then(UtilService.handleSuccess, UtilService.handleError('Failed to delete user invitation'));
        }

    }
})();

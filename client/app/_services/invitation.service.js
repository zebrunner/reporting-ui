(function() {
    'use strict';

    angular
        .module('app.services')
        .factory('InvitationService', ['$httpMock', '$rootScope', '$state', '$httpParamSerializer', 'UtilService', 'UserService', 'API_URL', 'iam_API_URL', InvitationService])

    function InvitationService($httpMock, $rootScope, $state, $httpParamSerializer, UtilService, UserService, API_URL, iam_API_URL) {
        let invitations = [];
        const service = {
            invite,
            getInvitation,
            search,
            deleteInvitation,
            get invitations() {
                return invitations;
            },
            set invitations(data) {
                invitations = data;
            }
        };

        return service;

        function invite(invitations) {
            const authData = JSON.parse(localStorage.getItem('auth'));

            return $httpMock.post(`${iam_API_URL}/api/iam/v1/invitations`, invitations.invitationTypes, {headers: {'Authorization':`${authData.authTokenType} ${authData.authToken}`}})
                .then(UtilService.handleSuccess, UtilService.handleError('Failed to invite users'));
        }

        function getInvitation(token) {
            return $httpMock.get(`${iam_API_URL}/api/iam/v1/invitations?token=${token}`).then(UtilService.handleSuccess, UtilService.handleError('Failed to get user invitation'));
        }

        function search(sc) {
            const path = $httpParamSerializer({query: sc.query, page: sc.page, pageSize: sc.pageSize, orderBy: sc.orderBy, sortOrder: sc.sortOrder});

            return $httpMock.get(`${iam_API_URL}/api/iam/v1/invitations?${path}`).then(UtilService.handleSuccess, UtilService.handleError('Failed to search user invitations'));
        }

        function deleteInvitation(id) {
            return $httpMock.delete(`${iam_API_URL}/api/iam/v1/invitations/${id}`).then(UtilService.handleSuccess, UtilService.handleError('Failed to delete user invitation'));
        }

    }
})();

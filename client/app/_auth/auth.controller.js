'use strict';

const authController = function authController(
    $scope,
    $rootScope,
    $location,
    $state,
    authService,
    UtilService,
    InvitationService,
    messageService,
    ) {
    'ngInject';

    $scope.UtilService = UtilService;

    $scope.credentials = {
        valid: true
    };

    $scope.VALIDATIONS = UtilService.validations;

    $scope.invitation = {};

    $scope.getInvitation = function (token) {
        InvitationService.getInvitation(token).then(function (rs) {
            if(rs.success) {
                $scope.invitation = rs.data;
                $scope.user = {};
                $scope.user.email = $scope.invitation.email;
                $scope.user.source = $scope.invitation.source;
            } else {
                $state.go('signin');
            }
        });
    };

    var token;

    Object.defineProperties($scope, {
        companyLogo: {
            get: () => $rootScope.companyLogo,
        },
        versions: {
            get: () => $rootScope.version,
        },
    });

    $scope.goToState = function (state) {
        $state.go(state);
    };

    (function initController() {
        switch($state.current.name) {
            case 'signup':
                token = $location.search()['token'];
                $scope.getInvitation(token);
                break;
        }
        authService.clearCredentials();
    })();

    $scope.signup = function(user, form) {
        authService.signUp(user, token).then(function(rs) {
                if (rs.success) {
                    $state.go('signin', { user });
                } else {
                    UtilService.resolveError(rs, form, 'validationError', 'username').then(function (rs) {
                    }, function (rs) {
                        messageService.error(rs.message);
                    });
                }
            });
    };

    $scope.onChange = function(input) {
        input.$setValidity('validationError', true);
    };
};

export default authController;

'use strict';

const authController = function authController(
    $scope,
    $rootScope,
    $location,
    $state,
    $templateCache,
    $stateParams,
    authService,
    CompanySettings,
    UserService,
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

    $scope.forgotPasswordType = {};
    $scope.forgotPasswordEmailWasSent = false;

    Object.defineProperty($scope, 'companyLogoUrl', {
       get: () => CompanySettings.companyLogoUrl,
    });

    $scope.emailType = {};

    $scope.forgotPassword = function (forgotPassword) {
        authService.forgotPassword(forgotPassword).then(function (rs) {
            if(rs.success) {
                $scope.forgotPassword = {};
                $scope.forgotPasswordEmailWasSent = true;
            } else {
                messageService.error(rs.message);
            }
        });
    };

    $scope.getForgotPasswordInfo = function (token) {
        authService.getForgotPasswordInfo(token).then(function (rs) {
            if(rs.success) {
                $scope.forgotPasswordType.email = rs.data.email;
            }
        });
    };

    $scope.resetPassword = function (credentials) {
        credentials.userId = 0;
        authService.resetPassword(credentials, token).then(function (rs) {
            if(rs.success) {
                messageService.success('Your password was changed successfully');
                $state.go('signin');
            } else {
                messageService.error(rs.message);
            }
        });
    };

    $scope.goToState = function (state) {
        $state.go(state);
    };

    (function initController() {
        switch($state.current.name) {
            case 'signup':
                token = $location.search()['token'];
                $scope.getInvitation(token);
                break;
            case 'forgotPassword':
                break;
            case 'resetPassword':
                token = $location.search()['token'];
                if(! token) {
                    $state.go('signin');
                    return;
                }
                $scope.getForgotPasswordInfo(token);
            default:
                break;
        }
        if ($stateParams.user) {
            $scope.credentials.usernameOrEmail = $stateParams.user.email;
            $scope.credentials.password = $stateParams.user.password;
        }
        authService.clearCredentials();
    })();

    $scope.signin = function(credentials) {
        authService.login(credentials.usernameOrEmail, credentials.password)
            .then(function(rs) {
                if (rs.success) {
                    var payload = {
                        auth: rs.data
                    };

                    if (rs.firstLogin === 'true') {
                        payload.firstLogin = rs.firstLogin;
                    } else {
                        $state.params.location && (payload.location = $state.params.location);
                        $state.params.referrer && (payload.referrer = $state.params.referrer);
                        $state.params.referrerParams && (payload.referrerParams = $state.params.referrerParams);
                    }
                    $rootScope.$broadcast('event:auth-loginSuccess', payload);
                } else {
                    $scope.credentials = {
                        valid: false
                    };
                }
            });
    };

    $scope.signup = function(user, form) {
        authService.signUp(user, token).then(function(rs) {
                if (rs.success) {
                    $state.go('signin', { user });
                } else {
                    messageService.error(rs.error.data.message);
                }
            });
    };

    $scope.onChange = function(input) {
        input.$setValidity('validationError', true);
    };
};

export default authController;

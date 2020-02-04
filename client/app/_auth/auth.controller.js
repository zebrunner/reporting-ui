'use strict';

const authController = function authController($scope, $window, $rootScope, $location, $interval, $state, $cookies, $templateCache, AuthService, UserService,
                            UtilService, InvitationService, messageService, $stateParams) {
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

    Object.defineProperty($scope, 'companyLogo', {
       get: () => $rootScope.companyLogo,
    });

    $scope.emailType = {};

    $scope.forgotPassword = function (forgotPassword) {
        AuthService.forgotPassword(forgotPassword).then(function (rs) {
            if(rs.success) {
                $scope.forgotPassword = {};
                $scope.forgotPasswordEmailWasSent = true;
            } else {
                messageService.error(rs.message);
            }
        });
    };

    $scope.getForgotPasswordInfo = function (token) {
        AuthService.getForgotPasswordInfo(token).then(function (rs) {
            if(rs.success) {
                $scope.forgotPasswordType.email = rs.data.email;
            }
        });
    };

    $scope.resetPassword = function (credentials) {
        credentials.userId = 0;
        AuthService.resetPassword(credentials, token).then(function (rs) {
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

    let gitHubPopUp;
    $scope.connectToGitHub = function () {
        var url = 'http://localhost:8082/zafira-ws/oauth2/authorization/github';
        var height = 650;
        var width = 450;
        var location = getCenterWindowLocation(height, width);
        var gitHubPopUpProperties = 'toolbar=0,scrollbars=1,status=1,resizable=1,location=1,menuBar=0,width=' + width + ', height=' + height + ', top=' + location.top + ', left=' + location.left;
        gitHubPopUp = $window.open(url, 'GithubAuth', gitHubPopUpProperties);

        var localStorageWatcher = $interval(function () {
            var token = localStorage.getItem('authToken');
            if (token) {
                const authToken = JSON.parse(token);
                gitHubPopUp.close();
                onLoginSuccess(authToken);
                localStorage.removeItem('authToken');
                $interval.cancel(localStorageWatcher);
            }
        }, 200);

        if (window.focus) {
            gitHubPopUp.focus();
        }
    };

    function getCenterWindowLocation(height, width) {
        var dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
        var dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screenY;
        var w = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
        var h = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;
        var left = ((w / 2) - (width / 2)) + dualScreenLeft;
        var top = ((h / 2) - (height / 2)) + dualScreenTop;
        return { 'top': top, 'left': left };
    }

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
        AuthService.ClearCredentials();
    })();

    $scope.signin = function(credentials) {
        AuthService.Login(credentials.usernameOrEmail, credentials.password)
            .then(function(rs) {
                if (rs.success) {
                    onLoginSuccess(rs.data);
                } else {
                    $scope.credentials = {
                        valid: false
                    };
                }
            });
    };

    function onLoginSuccess(authToken) {
        var payload = {
            auth: authToken
        };

        $state.params.location && (payload.location = $state.params.location);
        $state.params.referrer && (payload.referrer = $state.params.referrer);
        $state.params.referrerParams && (payload.referrerParams = $state.params.referrerParams);
        $rootScope.$broadcast('event:auth-loginSuccess', payload);
    };

    $scope.signup = function(user, form) {
        AuthService.signup(user, token).then(function(rs) {
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

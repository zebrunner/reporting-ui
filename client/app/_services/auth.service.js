(function() {
    'use strict';

    angular
        .module('app.services')
        .factory('AuthService', AuthService);

    function AuthService($httpMock, $cookies, $rootScope, $state, UtilService, UserService, API_URL, jwtHelper) {
        'ngInject';

        const service = {
            Login,
            Invite,
            forgotPassword,
            getForgotPasswordInfo,
            resetPassword,
            getInvitation,
            signup,
            SetCredentials,
            ClearCredentials,
            RefreshToken,
            GenerateAccessToken,
            isLoggedIn,
            UserHasAnyRole,
            UserHasAnyPermission,
            hasValidToken,
            getAuthData,
            getTenant
        };

        function Login(usernameOrEmail, password) {
            return $httpMock.post(API_URL + '/api/auth/login', {
                'username': usernameOrEmail,
                'password': password
            }).then(UtilService.handleSuccess, UtilService.handleError('Invalid credentials'));
        }

        function getTenant() {
            return $httpMock.get(API_URL + '/api/auth/tenant').then(UtilService.handleSuccess, UtilService.handleError('Unable to get tenant info'));
        }

        function Invite(emails) {
            return $httpMock.post(API_URL + '/api/auth/invite', emails).then(UtilService.handleSuccess, UtilService.handleError('Failed to invite users'));
        }

        function forgotPassword(forgotPassword) {
            return $httpMock.post(API_URL + '/api/auth/password/forgot', forgotPassword).then(UtilService.handleSuccess, UtilService.handleError('Unable to restore password'));
        }

        function getForgotPasswordInfo(token) {
            return $httpMock.get(API_URL + '/api/auth/password/forgot?token=' + token).then(UtilService.handleSuccess, function (rs) {
                $state.go('signin');
            });
        }

        function resetPassword(credentials, token) {
            return $httpMock.put(API_URL + '/api/auth/password', credentials, {headers: {'Access-Token': token}}).then(UtilService.handleSuccess, UtilService.handleError('Unable to restore password'));
        }

        function getInvitation(token) {
            return $httpMock.get(API_URL + '/api/auth/invite?token=' + token).then(UtilService.handleSuccess, UtilService.handleError('Failed to get user invitation'));
        }

        function signup(user, token) {
            return $httpMock.post(API_URL + '/api/auth/signup', user, {headers: {'Access-Token': token}}).then(UtilService.handleSuccess, UtilService.handleError('Failed to sign up'));
        }

        function RefreshToken(token) {
            return $httpMock.post(API_URL + '/api/auth/refresh', { 'refreshToken': token }, { skipAuthorization: true })
                .then(UtilService.handleSuccess, UtilService.handleError('Invalid refresh token'));
        }

        function GenerateAccessToken(token) {
            return $httpMock.get(API_URL + '/api/auth/access').then(UtilService.handleSuccess, UtilService.handleError('Unable to generate token'));
        }

        function SetCredentials(auth) {
            $rootScope.globals = {
                "auth": auth
            };
            $cookies.putObject('globals', $rootScope.globals);
        }

        function ClearCredentials() {
            UserService.clearCurrentUser();
            $rootScope.globals = {};
            $cookies.remove('globals');
        }

        function getAuthData() {
            var globals = $rootScope.globals || $cookies.getObject('globals');

            return globals && globals.auth;
        }

        function hasValidToken() {
            const auth = getAuthData() || {};

            return auth.refreshToken && !jwtHelper.isTokenExpired(auth.refreshToken);
        }

        function isLoggedIn() {
            return !!(UserService.currentUser && $rootScope.globals.auth);
        }

        function UserHasAnyRole(roles) {
            if (!isLoggedIn()) {
                return false;
            }
            var found = false;
            angular.forEach(roles, function(role, index) {
                if (UserService.currentUser.roles.indexOf(role) >= 0) {
                    found = true;
                    return;
                }
            });
            return found;
        }

        function UserHasAnyPermission(permissions) {
            if (!isLoggedIn()) {
                return false;
            }
            var found = false;
            angular.forEach(permissions, function(permission, index) {
                angular.forEach(UserService.currentUser.permissions, function(userPermission, index) {
                    if (userPermission.name === permission) {
                        found = true;
                        return;
                    }
                });
            });
            return found;
        }

        return service;
    }

    angular.module('app')
        .directive('hasAnyRole', ['AuthService', function(AuthService) {
            return {
                restrict: 'A',
                scope: {
                    exceptCondition: '@'
                },
                link: function(scope, elem, attrs) {
                    scope.$watch(AuthService.isLoggedIn, function(newVal) {
                        if(newVal) {
                            var exceptValue = !!(attrs.exceptCondition && attrs.exceptCondition == 'true');
                            if(! exceptValue) {
                                if (AuthService.UserHasAnyRole(eval(attrs.hasAnyRole))) {
                                    elem.show();
                                } else {
                                    elem.hide();
                                }
                            } else {
                                if (AuthService.UserHasAnyRole(eval(attrs.hasAnyRole))) {
                                    elem.hide()
                                } else {
                                    elem.show();
                                }
                            }
                        }
                    });
                }
            }
        }]).directive('hasAnyPermission', ['AuthService', function(AuthService) {
            return {
                restrict: 'A',
                link: function(scope, elem, attrs) {
                    scope.$watch(AuthService.isLoggedIn, function() {
                        if (AuthService.UserHasAnyPermission(eval(attrs.hasAnyPermission))) {
                            // elem.show();
                            elem.css('display', '');
                        } else {
                            elem.hide();
                        }
                    });
                }
            }
        }]).directive('isOwner', ['AuthService', function(AuthService) {
        return {
            restrict: 'A',
            link: function(scope, elem, attrs) {
                scope.$watch(AuthService.isLoggedIn, function() {
                    var currentUser = attrs.user && attrs.user.length ? JSON.parse(attrs.user) : {};
                    if (currentUser && currentUser.id == attrs.isOwner) {
                        elem.show();
                    } else {
                        elem.hide();
                    }
                });
            }
        }
    }]);
})();

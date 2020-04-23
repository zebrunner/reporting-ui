'use strict';

const authService = function authService(
    $httpMock,
    $rootScope,
    $state,
    UtilService,
    UserService,
    API_URL,
    jwtHelper,
) {
    'ngInject';

    let authData = null;
    const service = {
        isMultitenant: false,
        login,
        invite, // TODO: looks like unused, see invitationService
        forgotPassword,
        getForgotPasswordInfo,
        resetPassword,
        getInvitation, // TODO: looks like unused, see invitationService
        signUp,
        setCredentials,
        clearCredentials,
        refreshToken,
        generateAccessToken,
        userHasAnyRole,
        userHasAnyPermission,
        hasValidToken,
        getTenant,

        get authData() {
            if (!authData && localStorage.getItem('auth')) {
                authData = JSON.parse(localStorage.getItem('auth'));
            }

            return authData;
        },
        get isLoggedIn() { return !!(this.authData && UserService.currentUser); },
        get tenant() { return this.authData?.tenant; },
    };

    function login(username, password) {
        return $httpMock.post(API_URL + '/api/auth/login', { username, password })
            .then((res) => {
                const headers = res.headers();

                return { success: true, data: res.data, 'firstLogin': headers['first-login'] };
            }, UtilService.handleError('Invalid credentials'));
    }

    function getTenant() {
        return $httpMock.get(API_URL + '/api/auth/tenant')
            .then(UtilService.handleSuccess, UtilService.handleError('Unable to get tenant info'));
    }

    function invite(emails) {
        return $httpMock.post(API_URL + '/api/auth/invite', emails)
            .then(UtilService.handleSuccess, UtilService.handleError('Failed to invite users'));
    }

    function forgotPassword(forgotPassword) {
        return $httpMock.post(API_URL + '/api/auth/password/forgot', forgotPassword)
            .then(UtilService.handleSuccess, UtilService.handleError('Unable to restore password'));
    }

    function getForgotPasswordInfo(token) {
        return $httpMock.get(API_URL + '/api/auth/password/forgot?token=' + token)
            // TODO: move redirection action from service
            .then(UtilService.handleSuccess, () => {
                $state.go('signin');
            });
    }

    function resetPassword(credentials, token) {
        return $httpMock.put(API_URL + '/api/auth/password', credentials, {headers: {'Access-Token': token}})
            .then(UtilService.handleSuccess, UtilService.handleError('Unable to restore password'));
    }

    function getInvitation(token) {
        return $httpMock.get(API_URL + '/api/auth/invite?token=' + token)
            .then(UtilService.handleSuccess, UtilService.handleError('Failed to get user invitation'));
    }

    function signUp(user, token) {
        return $httpMock.post(API_URL + '/api/auth/signup', user, {headers: {'Access-Token': token}})
            .then(UtilService.handleSuccess, UtilService.handleError('Failed to sign up'));
    }

    function refreshToken(token) {
        return $httpMock.post(API_URL + '/api/auth/refresh', { 'refreshToken': token }, { skipAuthorization: true })
            .then(UtilService.handleSuccess, UtilService.handleError('Invalid refresh token'));
    }

    function generateAccessToken() {
        return $httpMock.get(API_URL + '/api/auth/access')
            .then(UtilService.handleSuccess, UtilService.handleError('Unable to generate token'));
    }

    function setCredentials(auth) {
        localStorage.setItem('auth', JSON.stringify(auth));
        authData = auth;
    }

    function clearCredentials() {
        localStorage.removeItem('auth');
        authData = null;
        UserService.clearCurrentUser();
    }

    function hasValidToken() {
        return authData?.refreshToken && !jwtHelper.isTokenExpired(authData.refreshToken);
    }

    function userHasAnyRole(roles) {
        if (!service.isLoggedIn) { return; }

        var found = false;
        angular.forEach(roles, function(role, index) {
            if (UserService.currentUser.roles.indexOf(role) >= 0) {
                found = true;
                return;
            }
        });
        return found;
    }

    /**
     * returns if current user has any of provided permissions
     * @param {String[]} permissions - array of permission names
     * @returns {boolean}
     */
    function userHasAnyPermission(permissions) {
        if (!service.isLoggedIn) { return; }

        return (UserService.currentUser.permissions || []).some(({ name }) => permissions.includes(name));
    }

    return service;
};

export default authService;

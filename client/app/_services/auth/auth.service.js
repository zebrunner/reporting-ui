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
        serviceUrl: null,
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
        return $httpMock.post(`${$httpMock.serviceUrl}/api/iam/v1/auth/login`, { username, password })
            .then((res) => {
                const headers = res.headers();

                return { success: true, data: res.data, 'firstLogin': headers['first-login'] };
            }, UtilService.handleError('Invalid credentials'));
    }

    function getTenant() {
        return $httpMock.get(`${API_URL}/api/auth/tenant`)
            .then(UtilService.handleSuccess, UtilService.handleError('Unable to get tenant info'));
    }

    function invite(emails) {
        return $httpMock.post(API_URL + '/api/auth/invite', emails)
            .then(UtilService.handleSuccess, UtilService.handleError('Failed to invite users'));
    }

    function forgotPassword(forgotPassword) {
        return $httpMock.post(`${$httpMock.serviceUrl}/api/iam/v1/users/password-resets`, forgotPassword)
            .then(UtilService.handleSuccess, UtilService.handleError('Unable to restore password'));
    }

    function getForgotPasswordInfo(token) {
        return $httpMock.get(`${$httpMock.serviceUrl}/api/iam/v1/users/password-resets?token=${token}`)
            // TODO: move redirection action from service
            .then(UtilService.handleSuccess, () => {
                $state.go('signin');
            });
    }

    function resetPassword(credentials, token) {
        const data = { resetToken: token, newPassword: credentials.password };

        return $httpMock.delete(`${$httpMock.serviceUrl}/api/iam/v1/users/password-resets`, {data: data, headers: {'Content-Type': 'application/json'}})
            .then(UtilService.handleSuccess, UtilService.handleError('Unable to restore password'));
    }

    function getInvitation(token) {
        return $httpMock.get(API_URL + '/api/auth/invite?token=' + token)
            .then(UtilService.handleSuccess, UtilService.handleError('Failed to get user invitation'));
    }

    function signUp(user, token) {
        return $httpMock.post(`${$httpMock.serviceUrl}/api/iam/v1/users?invitation-token=${token}`, user)
            .then(UtilService.handleSuccess, UtilService.handleError('Failed to sign up'));
    }

    function refreshToken(token) {
        return $httpMock.post(`${$httpMock.serviceUrl}/api/iam/v1/auth/refresh`, { 'refreshToken': token }, { skipAuthorization: true })
            .then(UtilService.handleSuccess, UtilService.handleError('Invalid refresh token'));
    }

    function generateAccessToken() {
        return $httpMock.get(`${$httpMock.serviceUrl}/api/iam/v1/auth/access`, {headers: {Authorization: `${authData.authTokenType} ${authData.authToken}`}})
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

    /**
     * returns if current user has any of provided permissions
     * @param {String[]} permissions - array of permission names
     * @returns {boolean}
     */
    function userHasAnyPermission(permissions) {
        if (!service.isLoggedIn) { return; }

        return (UserService.currentUser.permissions || []).some((name) => permissions.includes(name));
    }

    return service;
};

export default authService;

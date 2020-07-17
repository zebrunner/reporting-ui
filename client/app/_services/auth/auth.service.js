'use strict';

const authService = function authService(
    $httpMock,
    $rootScope,
    $state,
    UtilService,
    UserService,
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
        parseToken,
        renewToken,
        generateAccessToken,
        userHasAnyPermission,
        hasValidToken,
        getTenant,
        getSamlConfigs,

        get authData() {
            if (!authData && localStorage.getItem('zeb-auth')) {
                authData = JSON.parse(localStorage.getItem('zeb-auth'));
            }

            return authData;
        },
        get isLoggedIn() { return !!(this.authData && UserService.currentUser); },
        get tenant() { return this.authData?.tenantName; },
        get refreshToken() { return authData?.refreshToken; },
    };

    function login(username, password) {
        return $httpMock.post(`${$httpMock.apiHost}/api/iam/v1/auth/login`, { username, password })
            .then((res) => {
                const headers = res.headers();

                return { success: true, data: res.data, 'firstLogin': headers['x-zbr-first-login'] };
            }, UtilService.handleError('Invalid credentials'));
    }

    function getTenant() {
        return $httpMock.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/auth/tenant`, { skipAuthorization: true })
            .then(UtilService.handleSuccess, UtilService.handleError('Unable to get tenant info'));
    }

    function invite(emails) {
        return $httpMock.post(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/auth/invite`, emails)
            .then(UtilService.handleSuccess, UtilService.handleError('Failed to invite users'));
    }

    function forgotPassword(forgotPassword) {
        return $httpMock.post(`${$httpMock.apiHost}/api/iam/v1/users/password-resets`, forgotPassword).then(UtilService.handleSuccess, UtilService.handleError('Unable to restore password'));
    }

    function getForgotPasswordInfo(token) {
        return $httpMock.get(`${$httpMock.apiHost}/api/iam/v1/users/password-resets?token=${token}`)
            // TODO: move redirection action from service
            .then(UtilService.handleSuccess, () => {
                $state.go('signin');
            });
    }

    function resetPassword(credentials, token) {
        const data = { resetToken: token, newPassword: credentials.password };

        return $httpMock.delete(`${$httpMock.apiHost}/api/iam/v1/users/password-resets`, {data: data, headers: {'Content-Type': 'application/json'}})
            .then(UtilService.handleSuccess, UtilService.handleError('Unable to restore password'));
    }

    function getInvitation(token) {
        return $httpMock.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/auth/invite?token=${token}`)
            .then(UtilService.handleSuccess, UtilService.handleError('Failed to get user invitation'));
    }

    function signUp(user, token) {
        return $httpMock.post(`${$httpMock.apiHost}/api/iam/v1/users?invitation-token=${token}`, user).then(UtilService.handleSuccess, UtilService.handleError('Failed to sign up'));
    }

    function renewToken(token) {
        const params = { 'refreshToken': token };
        const settings = { skipAuthorization: true };

        return $httpMock.post(`${$httpMock.apiHost}/api/iam/v1/auth/refresh`, params, settings)
            .then(UtilService.handleSuccess, UtilService.handleError('Invalid refresh token'));
    }

    function parseToken(token) {
        const params = { 'authToken': token };
        const settings = { skipAuthorization: true };

        return $httpMock.post(`${$httpMock.apiHost}/api/iam/v1/auth/parse`, params, settings)
            .then(UtilService.handleSuccess, UtilService.handleError('Invalid auth token'));
    }

    function generateAccessToken() {
        return $httpMock.get(`${$httpMock.apiHost}/api/iam/v1/auth/access`).then(UtilService.handleSuccess, UtilService.handleError('Unable to generate token'));
    }

    function setCredentials(auth) {
        console.log(auth);
        localStorage.setItem('zeb-auth', JSON.stringify(auth));
        authData = auth;
    }

    function clearCredentials() {
        localStorage.removeItem('zeb-auth');
        authData = null;
        UserService.clearCurrentUser();
    }

    function hasValidToken() {
        return authData?.authToken;
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

    function getSamlConfigs() {
        return $httpMock.get(`${$httpMock.apiHost}/api/iam/v1/identity-providers`).then(UtilService.handleSuccess, UtilService.handleError('Unable to get identity providers'));
    }

    return service;
};

export default authService;

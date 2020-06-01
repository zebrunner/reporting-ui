import { from, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const MigrationAuthService = (
    $rootScope,
    MigrationRequestService,
    authService,
    $location,
    $state,
) => {
    'ngInject';

    return {
        prepareAuthPage,
        login,
        handleLogin,

        forgotPassword,

        resetPassword,
        preparePasswordResetPage,
        handlePasswordReset,
        getToken,
    };

    function prepareAuthPage() {
        authService.clearCredentials();
    }

    function login(username, password) {
        return from(
            MigrationRequestService.post('/api/auth/login', { username, password })
                .then(res => ({ data: res.data, firstLogin: res.headers()['first-login'] }))
        );
    }

    function handleLogin(payload) {
        $rootScope.$broadcast('event:auth-loginSuccess', payload);
        return of(true);
    }

    function forgotPassword(email) {
        return from(MigrationRequestService.post('/api/auth/password/forgot', { email }));
    }

    function resetPassword(model, token) {
        return from(MigrationRequestService.put(
            '/api/auth/password',
            model,
            { headers: { 'Access-Token': token } },
        ));
    }

    function preparePasswordResetPage(token) {
        if (!token) {
            return $state.go('signin');
        }

        return from(MigrationRequestService.get(`/api/auth/password/forgot?token=${token}`)).pipe(
            catchError(() => {
                $state.go('signin');
                return of(false);
            }),
        ).subscribe();
    }

    function handlePasswordReset() {
        $state.go('signin');
    }

    function getToken() {
        return $location.search()['token'];
    }
}

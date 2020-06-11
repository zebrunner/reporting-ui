import { from, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

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
        login$,
        handleLogin$,

        forgotPassword$,

        resetPassword$,
        preparePasswordResetPage,
        handlePasswordReset,

        prepareSignupPage$,
        signup$,
        handleSignup,

        getToken,
    };

    function prepareAuthPage() {
        authService.clearCredentials();
    }

    function login$(username, password) {
        return from(
            MigrationRequestService.post('/api/auth/login', { username, password })
                .then(res => ({ data: res.data, firstLogin: res.headers()['first-login'] }))
        );
    }

    function handleLogin$(payload) {
        $rootScope.$broadcast('event:auth-loginSuccess', payload);
        return of(true);
    }

    function forgotPassword$(email) {
        return from(MigrationRequestService.post('/api/auth/password/forgot', { email }));
    }

    function resetPassword$(model, token) {
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

    function prepareSignupPage$(token) {
        if (!token) {
            $state.go('signin');
            return of(null);
        }

        return from(MigrationRequestService.get(`/api/invitations/info?token=${token}`)).pipe(
            map(({ data }) => data),
            catchError(() => {
                $state.go('signin');
                return of(null);
            }),
        );
    }

    function signup$(model, token) {
        return from(MigrationRequestService.post(
            '/api/auth/signup',
            model,
            { headers: { 'Access-Token': token } },
        ));
    }

    function handleSignup({ username: usernameOrEmail, password }) {
        $state.go('signin', {
            user: { usernameOrEmail, password },
        });
    }

    function getToken() {
        return $location.search()['token'];
    }
}

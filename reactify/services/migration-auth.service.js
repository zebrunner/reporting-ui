import { setCurrentUser } from '@zebrunner/core/store';
import { of, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';

export const MigrationAuthService = (
    RequestService,
    RouterService,
    UsersService,
    $ngRedux,
    SnackbarService,
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
        // TODO: clear state. Do I need that?
    }

    function login$(username, password) {
        return RequestService.post$(
            '/api/auth/login',
            { username, password },
            {},
            { withResponse: true, withServer: true },
        ).pipe(
            map(({ response: data, xhr }) => {
                let firstLogin;

                try {
                    firstLogin = xhr.getResponseHeader('first-login');
                } catch {
                    firstLogin = false;
                }

                return { data, firstLogin };
            }),
        );
    }

    function handleLogin$(payload) {
        // TODO: check that
        // authService.setCredentials(payload.auth);
        // $scope.initSession();
        return UsersService.fetchUser$().pipe(
            map(({ user, ...otherData }) => ({ ...user, ...otherData })),
            map(user => ({
                ...user,
                isAdmin: user.roles.indexOf('ROLE_ADMIN') >= 0,
                firstLogin: payload.firstLogin,
                preferences: UsersService.preferencesToUserData(user.preferences),
            })),
            // TODO: $scope.main.skin = user.theme;
            tap(({ performanceDashboardId }) => performanceDashboardId
                ?? SnackbarService.error(`'User Performance' dashboard is unavailable!`)),
            tap(({ personalDashboardId }) => personalDashboardId
                ?? SnackbarService.error(`'Personal' dashboard is unavailable!`)),
            tap(({ defaultDashboardId }) => defaultDashboardId
                ?? SnackbarService.warning('Default Dashboard is unavailable!')),
            tap(user => $ngRedux.dispatch(setCurrentUser(user))),
            tap(() => {
                if (payload.firstLogin) {
                    // TODO: there is redirect to welcomePage
                    return RouterService.go('/');
                } else if (payload.location) {
                    return RouterService.go(payload.location);
                }

                return RouterService.go('/');
            }),
            catchError(({ message }) => {
                SnackbarService.error(message || 'Invalid credentials');
                return of(true);
            }),
        );
    }

    function forgotPassword$(email) {
        return RequestService.post$(
            '/api/auth/password/forgot',
            { email },
            {},
            { withAuth: false },
        );
    }

    function resetPassword$(model, token) {
        return RequestService.put$(
            '/api/auth/password',
            model,
            { 'Access-Token': token },
            { withAuth: false },
        );
    }

    function preparePasswordResetPage(token) {
        if (!token) {
            return RouterService.go('/signin');
        }

        return RequestService.get$(`/api/auth/password/forgot?token=${token}`).pipe(
            catchError(() => {
                RouterService.go('/signin');
                return of(false);
            }),
        ).subscribe();
    }

    function handlePasswordReset() {
        RouterService.go('/signin');
    }

    function prepareSignupPage$(token) {
        if (!token) {
            RouterService.go('/signin');
            return of(null);
        }

        return RequestService.get$(`/api/invitations/info?token=${token}`).pipe(
            catchError(() => {
                RouterService.go('/signin');
                return of(null);
            }),
        );
    }

    function signup$(model, token) {
        return RequestService.post$(
            '/api/auth/signup',
            model,
            { 'Access-Token': token },
            { withAuth: false },
        ).pipe(
            catchError(({ target }) => throwError({ status: target.status, data: target.response })),
        );
    }

    function handleSignup({ username: usernameOrEmail, password }) {
        RouterService.go('/signin', {
            user: { usernameOrEmail, password },
        });
    }

    function getToken() {
        return RouterService.queryParams?.token;
    }
}

import { setCurrentUser } from '@zebrunner/core/store';
import { of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';

export const MigrationAuthService = (
    RequestService,
    RouterService,
    UsersService,
    $ngRedux,
    ShackbarService,
) => {
    'ngInject';

    return {
        prepareAuthPage,
        login,
        handleLogin,
    };

    function prepareAuthPage() {
        // TODO: clear state. Do I need that?
    }

    function login(username, password) {
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

    function handleLogin(payload) {
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
            tap(({ performanceDashboardId }) => !performanceDashboardId
                && ShackbarService.error(`'User Performance' dashboard is unavailable!`)),
            tap(({ personalDashboardId }) => !personalDashboardId
                && ShackbarService.error(`'Personal' dashboard is unavailable!`)),
            tap(({ defaultDashboardId }) => !defaultDashboardId
                && ShackbarService.warning('Default Dashboard is unavailable!')),
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
                ShackbarService.error(message || 'Invalid credentials');
                return of(true);
            }),
        );
    }
}

import { getVersions, getApplicationConfig, setTokens } from '@zebrunner/core/store';
import { of, from } from 'rxjs';
import { switchMap, tap, map, catchError } from 'rxjs/operators';

export default (
    $ngRedux,
    MigrationAuthService,
    $state,
    $scope,
    $safeDigest,
) => {
    'ngInject';

    let unsubscribe;

    return {
        credentials: null,

        signin,

        $onInit,
        $onDestroy,
    };

    function $onInit() {
        const mapStateToThis = state => ({
            versions: getVersions(state),
            application: getApplicationConfig(state),
        });
        unsubscribe = $ngRedux.connect(mapStateToThis, {})(this);

        const params = $state.params || { user: null };

        this.credentials = {
            valid: true,
            usernameOrEmail: params.user?.usernameOrEmail ?? '',
            password: params.user?.password ?? '',
        };

        MigrationAuthService.prepareAuthPage();
    }

    function $onDestroy() {
        if (unsubscribe) {
            unsubscribe();
        }
    }

    function signin(credentials, form) {
        form.$setPristine();
        form.$setUntouched();

        return MigrationAuthService.login(credentials.usernameOrEmail, credentials.password).pipe(
            tap(({ data }) => $ngRedux.dispatch(setTokens({
                access: data.accessToken,
                refresh: data.refreshToken,
                kind: data.type,
            }))),
            map(({ data: auth, firstLogin }) => {
                const payload = { auth, firstLogin };

                if (!payload.firstLogin && $state.params?.location) {
                    payload.location = $state.params.location
                }

                return payload;
            }),
            switchMap(payload => from(MigrationAuthService.handleLogin(payload))),
            catchError(() => {
                this.credentials = { valid: false };
                return of(true);
            }),
            tap($safeDigest.rxjs($scope)),
        ).subscribe();
    };
};

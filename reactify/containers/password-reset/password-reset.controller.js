import { getVersions, getApplicationConfig } from '@zebrunner/core/store';
import { of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export default (
    $ngRedux,
    MigrationAuthService,
    ShackbarService,
    $safeDigest,
    $scope,
    ValidationsService,
) => {
    'ngInject';

    let unsubscribe;

    return {
        model: {
            password: '',
            confirmPassword: '',
        },
        token: null,
        validations: ValidationsService,

        $onInit,
        $onDestroy,
        resetPassword,
    };

    function $onInit() {
        const mapStateToThis = state => ({
            versions: getVersions(state),
            application: getApplicationConfig(state),
        });

        unsubscribe = $ngRedux.connect(mapStateToThis, {})(this);

        this.token = MigrationAuthService.getToken();

        MigrationAuthService.preparePasswordResetPage(this.token);
    }

    function $onDestroy() {
        if (unsubscribe) {
            unsubscribe();
        }
    }

    function resetPassword() {
        MigrationAuthService.resetPassword({ ...this.model, userId: 0 }, this.token).pipe(
            tap(() => ShackbarService.success('Your password was changed successfully')),
            tap(payload => MigrationAuthService.handlePasswordReset(payload)),
            catchError(error => {
                ShackbarService.error(error.message || 'Unable to restore password');
                return of(true);
            }),
            tap($safeDigest.rxjs($scope)),
        ).subscribe();
    }
};

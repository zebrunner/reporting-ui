import { getVersions, getApplicationConfig } from '@zebrunner/core/store';
import { of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export default (
    $ngRedux,
    MigrationAuthService,
    SnackbarService,
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
        // We need userId because b/e requires that. Should be removed in the future realisations
        MigrationAuthService.resetPassword$({ ...this.model, userId: 0 }, this.token).pipe(
            tap(() => SnackbarService.success('Your password was changed successfully')),
            tap(payload => MigrationAuthService.handlePasswordReset(payload)),
            catchError(error => {
                SnackbarService.error(error.message || 'Unable to reset password');
                return of(true);
            }),
            tap($safeDigest.rxjs($scope)),
        ).subscribe();
    }
};

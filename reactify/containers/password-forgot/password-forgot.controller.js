import { getVersions, getApplicationConfig } from '@zebrunner/core/store';
import { of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export default (
    $ngRedux,
    MigrationAuthService,
    SnackbarService,
    $safeDigest,
    $scope,
) => {
    'ngInject';

    let unsubscribe;

    return {
        pendingSubmit: false,
        emailWasSent: false,
        email: '',

        $onInit,
        $onDestroy,
        submitForgotPassword,
    };

    function $onInit() {
        const mapStateToThis = state => ({
            versions: getVersions(state),
            application: getApplicationConfig(state),
        });

        unsubscribe = $ngRedux.connect(mapStateToThis, {})(this);
    }

    function $onDestroy() {
        if (unsubscribe) {
            unsubscribe();
        }
    }

    function submitForgotPassword() {
        this.pendingSubmit = true;
        MigrationAuthService.forgotPassword(this.email).pipe(
            tap(() => (this.emailWasSent = true)),
            catchError(error => {
                SnackbarService.error(error.message || 'Unable to restore password');
                return of(true);
            }),
            tap(() => (this.pendingSubmit = false)),
            tap($safeDigest.rxjs($scope)),
        ).subscribe();
    }
};

import { getVersions, getApplicationConfig } from '@zebrunner/core/store';
import { of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export default (
    $ngRedux,
    MigrationAuthService,
    ShackbarService,
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
        resetPassword,
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

    function resetPassword() {
        this.pendingSubmit = true;
        MigrationAuthService.resetPassword(this.email).pipe(
            tap(() => (this.emailWasSent = true)),
            catchError(error => {
                ShackbarService.error(error.message || 'Unable to restore password');
                return of(true);
            }),
            tap(() => (this.pendingSubmit = false)),
            tap($safeDigest.rxjs($scope)),
        ).subscribe();
    }
};

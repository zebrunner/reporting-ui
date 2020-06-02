import { getVersions, getApplicationConfig } from '@zebrunner/core/store';
import { of } from 'rxjs';
import { tap, filter, catchError } from 'rxjs/operators';

export default (
    $ngRedux,
    ValidationsService,
    MigrationAuthService,
    ShackbarService,
    $safeDigest,
    $scope,
) => {
    'ngInject';

    let unsubscribe;

    return {
        token: null,
        model: {
            email: '',
            username: '',
            password: '',
            // We use that field in sign up request
            source: null,
        },
        validations: ValidationsService,

        $onInit,
        $onDestroy,
        signup,
        onChange,
    };

    function $onInit() {
        const mapStateToThis = state => ({
            versions: getVersions(state),
            application: getApplicationConfig(state),
        });
        unsubscribe = $ngRedux.connect(mapStateToThis, {})(this);


        this.token = MigrationAuthService.getToken();

        MigrationAuthService.prepareSignupPage$(this.token).pipe(
            filter(model => !!model),
            tap(({ email, source }) => (this.model = { ...this.model, email, source })),
            tap($safeDigest.rxjs($scope)),
        ).subscribe();
    }

    function $onDestroy() {
        if (unsubscribe) {
            unsubscribe();
        }
    }

    function signup(form) {
        MigrationAuthService.signup$(this.model, this.token).pipe(
            tap(() => MigrationAuthService.handleSignup(this.model)),
            catchError(({ data, status }) => {
                const message = data?.error?.message;

                if (status === 400 && message) {
                    const formControl = form['username'];

                    formControl.$setValidity('serverError', false);
                    formControl.$error['serverError'] = message;
                } else {
                    ShackbarService.error('Failed to sign up.');
                }

                return of(true);
            }),
            tap($safeDigest.rxjs($scope)),
        ).subscribe();
    }

    function onChange(formControl) {
        formControl.$setValidity('serverError', true);
    }
};

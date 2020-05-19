'use strict';

import { isLeft } from 'fp-ts/lib/Either';
import { getVersions, getApplicationConfig } from '@zebrunner/core/build/cjs/store/application/selectors';

export default (
    $ngRedux,
    AuthService,
    $rootScope,
    $state,
) => {
    'ngInject';
    let unsubscribe;

    return {
        credentials: {
            valid: true,
        },

        signin,

        $onInit,
        $onDestroy,
    };

    function $onInit() {
        const mapStateToThis = state => ({
            versions: getVersions(state),
            application: getApplicationConfig(state),
        });
        $ngRedux.connect(mapStateToThis, {})(this);
    }

    function $onDestroy() {
        if (unsubscribe) {
            unsubscribe();
        }
    }

    function signin(credentials, form) {
        form.$setPristine();
        form.$setUntouched();

        return AuthService.login(credentials.usernameOrEmail, credentials.password)
            .then(rs => {
                if (isLeft(rs)) {
                    this.credentials = {
                        valid: false,
                    };
                    return;
                }

                const { data: auth, firstLogin } = rs.right;
                const payload = { auth };

                if (firstLogin) {
                    payload.firstLogin = firstLogin;
                } else {
                    if ($state.params.location) {
                        payload.location = $state.params.location
                    }

                    // TODO: check. I don't know we use that or not
                    if ($state.params.referrer) {
                        payload.referrer = $state.params.referrer;
                    }
                    if ($state.params.referrerParams) {
                        payload.referrerParams = $state.params.referrerParams;
                    }
                }

                AuthService.handleLogin(payload);
            });
    };
};

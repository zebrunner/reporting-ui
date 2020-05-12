'use strict';

export default (
    $rootScope,
    UtilService,
) => {
    'ngInject';

    return {
        credentials: {
            valid: true,
        },
        get companyLogo() { return $rootScope.companyLogo; },

        signin,
    };

    function signin(credentials, form) {
        UtilService.untouchForm(form);
        console.log(credentials, fetch);
        // return AuthService.signin(credentials)
        //     // TODO: the rest of logic that were ignored for now
        //     .then(() => RouterService.go('/'))
        //     .catch(e => { /* TODO: Error handler */ });
    };
};

'use strict';

export default (
    $rootScope,
    AuthService,
) => {
    'ngInject';

    return {
        credentials: {
            valid: true,
        },
        get companyLogo() { return $rootScope.companyLogo; },

        signin,
    };

    function signin(credentials) {
        console.log(credentials, fetch);
        return AuthService.signin(credentials)
            // TODO: the rest of logic that were ignored for now
            .then(() => this.history.push('/'))
            .catch(e => { /* TODO: Error handler */ });
    };
};

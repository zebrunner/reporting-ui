'use strict';

export default (
    $rootScope,
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
        throw new Error('Not implemented');
    };
};

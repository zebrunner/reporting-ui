'use strict';

export default (
    $rootScope,
) => {
    'ngInject';

    return {
        get version() { return $rootScope.version; },
    };
};

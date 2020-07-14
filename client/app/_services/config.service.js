(function () {
    'use strict';

    angular
        .module('app.services')
        .factory('ConfigService', ['$httpMock', '$rootScope', 'UtilService', '$q', ConfigService])

    function ConfigService($httpMock, $rootScope, UtilService, $q) {

        const data = {};

        return {
            getConfig,
        };

        function getConfig(name, force) {
            if (data[name] && !force) {
                return $q.resolve(data[name]);
            }


            return $httpMock.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/config/${name}`, { skipAuthorization: true })
                .then(res => {
                    if (res.data) {
                        data[name] = res.data;
                    }

                    return res;
                })
                .then(UtilService.handleSuccess, UtilService.handleError(`Unable to get config "${name}"`));
        }
    }
})();

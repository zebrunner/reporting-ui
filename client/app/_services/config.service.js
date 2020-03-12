(function () {
    'use strict';

    angular
        .module('app.services')
        .factory('ConfigService', ['$httpMock', '$rootScope', 'UtilService', 'API_URL', ConfigService])

    function ConfigService($httpMock, $rootScope, UtilService, API_URL, $q) {

        const data = {};

        return {
            getConfig,
        };

        function getConfig(name, force) {
            if (data[name] && !force) {
                return $q.resolve(data[name]);
            }


            return $httpMock.get(API_URL + '/api/config/' + name)
                .then(res => {
                    if (res.data) {
                        data[name] = res.data;
                    }

                    return res;
                })
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to get config "' + name + '"'));
        }
    }
})();

'use strict';

const progressbarInterceptor = function progressbarInterceptor($q, $cacheFactory, $timeout, $rootScope, $log, progressbarService) {
    'ngInject';

    return {
        'request': function(config) {
            // Check to make sure that the requester didn't explicitly ask us to ignore this request:
            if (!config.ignoreProgressBar) {
                progressbarService.increaseRequestsCount();
            }

            return config;
        },

        'response': function(response) {
            if (!response || !response.config) {
                $log.error('Broken interceptor detected: Config object not supplied in response:\n https://github.com/chieffancypants/angular-loading-bar/pull/50');
                return response;
            }

            if (!response.config.ignoreProgressBar) {
                progressbarService.decreaseRequestsCount();
            }

            return response;
        },

        'responseError': function(rejection) {
            if (!rejection || !rejection.config) {
                $log.error('Broken interceptor detected: Config object not supplied in response:\n https://github.com/chieffancypants/angular-loading-bar/pull/50');
                return $q.reject(rejection);
            }

            if (!rejection.config.ignoreProgressBar) {
                progressbarService.decreaseRequestsCount();
            }

            return $q.reject(rejection);
        }
    };
};

export default progressbarInterceptor;

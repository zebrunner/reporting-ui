(function () {
  'use strict';

  angular
    .module('app.services')
    .factory('AuthIntercepter', ['$rootScope', '$state', 'httpBuffer', function ($rootScope, $state, httpBuffer) {

      return {
        /**
         * Call this function to indicate that authentication was successful and trigger a
         * retry of all deferred requests.
         * @param data an optional argument to pass on to $broadcast which may be useful for
         * example if you need to pass through details of the user that was logged in
         * @param configUpdater an optional transformation function that can modify the
         * requests that are retried after having logged in.  This can be used for example
         * to add an authentication token.  It must return the request.
         */
        loginConfirmed: function (data, configUpdater) {
          var updater = configUpdater || function (config) { return config; };
          $rootScope.$broadcast('event:auth-loginConfirmed', data);
          httpBuffer.retryAll(updater);
        },

        /**
         * Call this function to indicate that authentication should not proceed.
         * All deferred requests will be abandoned or rejected (if reason is provided).
         * @param data an optional argument to pass on to $broadcast.
         * @param reason if provided, the requests are rejected; abandoned otherwise.
         */
        loginCancelled: function (data, reason) {
          httpBuffer.rejectAll(reason);
          $rootScope.$broadcast('event:auth-loginCancelled', data);
        }
      };
    }])

    /**
     * $http interceptor.
     * On 401 response (without 'ignoreAuthModule' option) stores the request
     * and broadcasts 'event:auth-loginRequired'.
     */
    .config(($httpProvider) => {
        'ngInject';

        $httpProvider.interceptors.push(($rootScope, $q, $injector, httpBuffer, API_URL) => {
            'ngInject';

            const UNRECOGNIZED_STATES = ['signin', 'signup'];

            return {
                request: function (request) {
                    // don't add auth header if skipAuthorization flag presents
                    if (request.skipAuthorization) {
                        delete request.skipAuthorization;

                        return request;
                    }

                    const authService = $injector.get('authService');
                    const authData = authService.authData;
                    // add authorization header to API requests
                    if ((request.url.includes(API_URL) || request.url.includes(authService.serviceUrl)) && authData) {
                        request.headers['Authorization'] = `${authData.authTokenType} ${authData.authToken}`;
                    }

                    return request;
                },
                responseError: function (rejection) {
                    const location = window.location.href;
                    const $state = $injector.get('$state');
                    const stateName = $state.current.name;

                    if (UNRECOGNIZED_STATES.indexOf(stateName) === -1) {
                        var config = rejection.config || {};

                        switch (rejection.status) {
                            case 401:
                                const payload = { location };
                                // handle 401 on refreshing expired token
                                if (rejection.config.url.includes('/api/iam/v1/auth/refresh')) {
                                    $rootScope.$broadcast('event:auth-tokenHasExpired', location);

                                    return $q.reject(rejection);
                                }
                                // cache rejected requests
                                var deferred = $q.defer();
                                var bufferLength = httpBuffer.append(config, deferred, location);
                                // handle 401 on first 401 rejection
                                if (bufferLength === 1) {
                                    $rootScope.$broadcast('event:auth-loginRequired', payload);
                                }

                                return deferred.promise;
                            /*case 403:
                                $injector.get('$state').go('403');
                                break;*/
                        }
                    }
                    // otherwise, default behaviour
                    return $q.reject(rejection);
                }
            };
        });
    });

  /**
   * Private module, a utility, required internally by 'http-auth-interceptor'.
   */
  angular
    .module('app.services')
    .factory('httpBuffer', ['$injector', '$rootScope', function ($injector, $rootScope) {
      /** Holds all the requests, so they can be re-requested in future. */
      var buffer = [];

      /** Service initialized later because of circular dependency problem. */
      var $http;

      function retryHttpRequest(config, deferred) {
        function successCallback(response) {
          deferred.resolve(response);
        }
        function errorCallback(response) {
          deferred.reject(response);
        }
        $http = $http || $injector.get('$http');
        $http(config).then(successCallback, errorCallback);
      }

      return {
        /**
         * Appends HTTP request configuration object with deferred response attached to buffer.
         * @return {Number} The new length of the buffer.
         */
        append: function (config, deferred, location) {
          return buffer.push({
            config: config,
            deferred: deferred,
            location: location
          });
        },

        /**
         * Abandon or reject (if reason provided) all the buffered requests.
         */
        rejectAll: function (reason) {
          if (reason) {
            for (var i = 0; i < buffer.length; ++i) {
              buffer[i].deferred.reject(reason);
            }
          }
          buffer = [];
        },

        /**
         * Retries all the buffered requests clears the buffer.
         */
        retryAll: function (updater) {
          for (var i = 0; i < buffer.length; ++i) {
            var _cfg = updater(buffer[i].config);
            if (_cfg !== false)
              retryHttpRequest(_cfg, buffer[i].deferred);
          }
          buffer = [];
        },

        getBuffer: function () {
          return buffer;
        }
      };
    }]);
})();

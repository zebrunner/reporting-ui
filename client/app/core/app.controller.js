(function () {
    'use strict';

    angular.module('app')
        .controller('AppCtrl', AppCtrl); // overall control
	    function AppCtrl(
	        $scope,
            $rootScope,
            $templateCache,
            $state,
            $window,
            $cookies,
            $q,
            appConfig,
            AuthService,
            UserService,
            SettingsService,
            ConfigService,
            messageService,
            SettingProvider,
            $timeout,
            toolsService,
            UI_VERSION,
            progressbarService,
            SafariFixesService,
            UtilService
        ) {
            'ngInject';

	        $scope.pageTransitionOpts = appConfig.pageTransitionOpts;
	        $scope.main = appConfig.main;
	        $scope.color = appConfig.color;
	        $rootScope.darkThemes = ['11', '21', '31', '22'];
	        $rootScope.currentOffset = 0;
            $rootScope.companyLogo = {
                name: 'COMPANY_LOGO_URL',
                value: SettingProvider.getCompanyLogoURl() || ''
            };

            var UNANIMATED_STATES = ['signin', 'signup', 'forgotPassword', 'resetPassword'];

            $scope.isAnimated = function() {
                return UNANIMATED_STATES.indexOf($state.current.name) == -1;
            };
            $scope.UtilService = UtilService;

            $scope.setOffset = function (event) {
	              $rootScope.currentOffset = 0;
	              var bottomHeight = $window.innerHeight - event.target.clientHeight - event.clientY;
	              if(bottomHeight < 400) {
	                  $rootScope.currentOffset = -250 + bottomHeight;
	              }
            };

	        $scope.initSession = toolsService.getTools;
	        $scope.progressbarService = progressbarService;

	        $rootScope.$on('event:auth-loginSuccess', function(ev, payload){
                AuthService.SetCredentials(payload.auth);
                $scope.initSession();
                UserService.initCurrentUser(true)
                    .then((user) => {
                        $scope.main.skin = user.theme;

                        if (payload.location) {
                            $window.location.href = payload.location;
                        } else if (payload.referrer) {
                            var params = payload.referrerParams || {};

                            $timeout(() => {
                                $state.go(payload.referrer, params);
                            });
                        } else {
                            $timeout(() => {
                                $state.go('home');
                            });
                        }
                    })
                    .catch(err => {
                        if (err && err.message) {
                            messageService.error(err.message);
                        }
                    });
	        });

            function getVersion() {
                return $q(function (resolve, reject) {
                    ConfigService.getConfig('version').then(function(rs) {
                        if (rs.success) {
                            $rootScope.version = rs.data;
                            $rootScope.version.ui = UI_VERSION;

                            resolve(rs.data);
                        } else {
                            reject(rs.message);
                        }
                    });
                });
            };

            function clearCache(version) {
                var v = $cookies.get('version');
                if(v !== version) {
                    $cookies.put('version', version);
                    $templateCache.removeAll();
                }
            };

	        (function initController() {
                SettingsService.getCompanyLogo()
                    .then(function(rs) {
                        if (rs.success) {
                            if (!$rootScope.companyLogo.value || $rootScope.companyLogo.value !== rs.data) {
                                $rootScope.companyLogo.value = rs.data.value;
                                $rootScope.companyLogo.id = rs.data.id;
                                SettingProvider.setCompanyLogoURL($rootScope.companyLogo.value);
                            }
                        }
                    });
                $rootScope.globals = $rootScope.globals && $rootScope.globals.auth ? $rootScope.globals : $cookies.getObject('globals') || {};
	            if ($rootScope.globals.auth) {
                    var currentUser;

                    $scope.initSession();

                    currentUser = UserService.currentUser;
                    if (!currentUser) {
                        UserService.initCurrentUser()
                            .then(function (user) {
                                $scope.main.skin = user.theme;
                            }, function() {});
                    } else {
                        $scope.main.skin = currentUser.theme;
                    }
	            }
                 getVersion();

                if (SafariFixesService.isIosSafari) {
                    SafariFixesService.registerForcedReloading();
                }
	        })();
	    }
})();

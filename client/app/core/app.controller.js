'use strict';

const appCtrl = function appCtrl(
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
    UtilService,
) {
    'ngInject';

    const vm = {
        isLoading: true,

        $onInit: initController,
    };

    $scope.pageTransitionOpts = appConfig.pageTransitionOpts;
    $scope.main = appConfig.main;
    $scope.color = appConfig.color;
    $rootScope.darkThemes = ['11', '21', '31', '22'];
    $rootScope.currentOffset = 0;
    $rootScope.companyLogo = {
        name: 'COMPANY_LOGO_URL',
        value: SettingProvider.getCompanyLogoURl() ?? '',
    };

    const UNANIMATED_STATES = ['signin', 'signup', 'forgotPassword', 'resetPassword'];

    $scope.isAnimated = function() {
        return UNANIMATED_STATES.indexOf($state.current.name) === -1;
    };
    $scope.UtilService = UtilService;

    $scope.setOffset = function (event) {
        $rootScope.currentOffset = 0;
        var bottomHeight = $window.innerHeight - event.target.clientHeight - event.clientY;

        if (bottomHeight < 400) {
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
                    }, 0, false);
                } else {
                    $timeout(() => {
                        $state.go('home');
                    }, 0, false);
                }
            })
            .catch(err => {
                if (err && err.message) {
                    messageService.error(err.message);
                }
            });
    });

    function initController() {
        if (UserService.currentUser?.theme) {
            $scope.main.skin = UserService.currentUser.theme;
        }
        if (SafariFixesService.isIosSafari) {
            SafariFixesService.registerForcedReloading();
        }
        vm.isLoading = false;
        $timeout(() => {
            $rootScope.$broadcast('event:fullscreen-logo', { type: 'hide', delay: 1000 });
        }, 300);
    }

    return vm;
};

export default appCtrl;

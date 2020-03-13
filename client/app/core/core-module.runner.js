'use-strict';

export function CoreModuleRunner(
    $rootScope,
    $urlRouter,
    $timeout,
    $state,
    $q,
    appHealthService,
    authService,
    UI_VERSION,
    SettingProvider,
    SettingsService,
    ConfigService,
    UserService,
    toolsService,
) {
    'ngInject';

    /**
     * Check API health and then activate UI Router.
     */
    // TODO: Temporarily disabled due errors
    // appHealthService.checkServerStatus()
    $q.resolve()
        .then(() => {
            appHealthService.changeHealthyStatus(true);

            getVersion();
            updateCompanyLogo();
            if (authService.authData) {
                UserService.initCurrentUser();
                toolsService.getTools();
            }
        })
        .catch(err => {
            // API is unavailable, we need to redirect
            appHealthService.changeHealthyStatus(false);

            $timeout(function() {
                const params = $state.current?.name ? { referrer: $state.current.name } : {};

                $state.go('500', params, {
                    // reload: true,
                    // inherit: false,
                    // notify: false, // do not broadcast $stateChangeStart
                });
            }, 0, false);
        })
        .finally(() => {
            if ( appHealthService.isHealthy) {
                // sync the current URL to the router
                $urlRouter.sync();
            }
            // Enable router listening
            $urlRouter.listen();
        });

    function getVersion() {
        return ConfigService.getConfig('version')
            .then(function(rs) {
                if (rs.success) {
                    $rootScope.version = rs.data;
                    $rootScope.version.ui = UI_VERSION;

                    return $rootScope.version;
                } else {
                    return $q.reject(rs.message);
                }
            });
    }

    function updateCompanyLogo() {
        return SettingsService.getCompanyLogo()
            .then(function(rs) {
                if (rs.success) {
                    if (!$rootScope.companyLogo.value || $rootScope.companyLogo.value !== rs.data) {
                        $rootScope.companyLogo = rs.data;
                        SettingProvider.setCompanyLogoURL($rootScope.companyLogo.value);

                        return $rootScope.companyLogo;
                    }
                } else {
                    return $q.reject(rs.message);
                }
            });
    }
}

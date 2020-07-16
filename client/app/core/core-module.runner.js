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
    CompanySettings,
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
    /**
     * Get tenant info to detect if it is a cloud version of reporting (it's could when multitenant is true).
     * TODO: Should be run after health checking
     */
    authService.getTenant()
        .then(response => {
            if (response.success) {
                authService.isMultitenant = response.data?.multitenant;
            }
        })
        .then(() => {
            appHealthService.changeHealthyStatus(true);

            getVersion();
            updateCompanyLogo();
            if (authService.authData) {
                UserService.initCurrentUser(false, authService.authData.userId);
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
        return CompanySettings.fetchCompanyLogo()
            .then((rs) => {
                if (rs.success) {
                    CompanySettings.companyLogo = rs.data;

                    return CompanySettings.companyLogo;
                } else {
                    return $q.reject(rs.message);
                }
            });
    }
}

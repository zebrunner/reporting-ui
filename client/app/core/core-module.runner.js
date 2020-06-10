'use-strict';

import { setApplicationConfig } from '@zebrunner/core/store';

export function CoreModuleRunner(
    $rootScope,
    $urlRouter,
    $timeout,
    $state,
    $q,
    appHealthService,
    authService,
    API_URL,
    UI_VERSION,
    SettingProvider,
    SettingsService,
    ConfigService,
    UserService,
    toolsService,
    $ngRedux,
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
                authService.serviceUrl = response.data?.serviceUrl;
            }
        })
        .then(() => {
            appHealthService.changeHealthyStatus(true);

            Promise.allSettled([
                getVersion(),
                updateCompanyLogo(),
            ]).then(() => {
                // TODO: replace API with API from the server's response.
                // Right now we use api.qaprosoft.farm and b/e always needs to get tenant
                // The API from server's response prevents that action and knows about tenant
                $ngRedux.dispatch(setApplicationConfig({
                    api: API_URL,
                    tenantIcon: $rootScope.companyLogo?.value,
                    versions: {service: $rootScope.version?.service, ui: UI_VERSION},
                    multitenant: authService?.isMultitenant,
                }));
            });

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

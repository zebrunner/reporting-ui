import { Users } from '@zebrunner/core'

const preferencesConfig = {
    DEFAULT_DASHBOARD: { name: 'defaultDashboard' },
    REFRESH_INTERVAL: {
        formatter: value => parseInt(value, 10),
        name: 'refreshInterval',
    },
    THEME: { name: 'theme' },
    DEFAULT_TEST_VIEW: { name: 'testsView' },
};

export const UsersService = () => {
    'ngInject';

    return {
        fetchUser$: Users.fetchUser$,
        preferencesToUserData,
    };

    function preferencesToUserData(preferences) {
        const defaultPreferences = { testsView: 'runs' };

        return preferences.reduce((res, preferency) =>
            preferencesConfig[preferency.name]
                ? {
                    ...res,
                    [preferencesConfig[preferency.name].name]: typeof preferencesConfig[preferency.name].formatter === 'function'
                        ? preferencesConfig[preferency.name].formatter(preferency.value)
                        : preferency.value,
                }
                : res,
            defaultPreferences,
        );
    }
}

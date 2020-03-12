(function () {
    'use strict';

    angular
        .module('app')
        .provider('SettingProvider', SettingProvider);

    function SettingProvider() {
        this.$get = function() {
            'ngInject';

            return {
                getCompanyLogoURl: function() {
                    return localStorage.getItem('companyLogoURL');
                },
                setCompanyLogoURL: function(logoURL) {
                    if (logoURL) {
                        localStorage.setItem('companyLogoURL', logoURL);
                    } else {
                        localStorage.removeItem('companyLogoURL');
                    }
                },
            };
        };
    }
})();

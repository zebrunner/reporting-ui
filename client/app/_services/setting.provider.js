(function () {
    'use strict';

    angular
        .module('app')
        .provider('SettingProvider', SettingProvider);

    function SettingProvider() {
        this.$get = function($cookies) {
            'ngInject';
            return {
                getCompanyLogoURl: function() {
                    return $cookies.get('companyLogoURL');
                },
                setCompanyLogoURL: function(logoURL) {
                    $cookies.put('companyLogoURL', logoURL);
                },
            };
        };
    }
})();

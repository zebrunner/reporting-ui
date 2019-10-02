(function () {
    'use strict';

    angular
        .module('app.services')
        .factory({ integrationsService });

    function integrationsService() {
        'ngInject';

        let _selectedType = null;

        return  {
            setType,
            storeType,
            getType,
            readType,
            clear
        };

        function setType(type) {
            _selectedType = type;
        }

        function getType() {
            return _selectedType;
        }

        function storeType() {
            sessionStorage.setItem('selectedIntegrationType', angular.toJson(_selectedType));
        }

        function deleteType() {
            sessionStorage.removeItem('selectedIntegrationType');
        }

        function readType() {
            const params = sessionStorage.getItem('selectedIntegrationType');

            params && (_selectedType = angular.fromJson(params));
        }

        function clear() {
            deleteType();
            clearDataCache();
        }

        function clearDataCache() {
            _selectedType = null;
        }
    }
})();

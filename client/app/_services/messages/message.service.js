(function () {
    'use strict';

    angular
        .module('app.services')
        .factory('messageService', ['$mdToast', messageService ]);

    function messageService($mdToast) {
        'ngInject'

        return {
            success: success,
        };

        function success(text) {
            var toast = $mdToast.simple()
                                .content(text)
                                .action('OK')
                                .highlightAction(true)
                                .hideDelay(0)
                                .position('bottom right');
            $mdToast.show(toast);
        }
    }
})();

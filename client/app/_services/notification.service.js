(function () {
    'use strict';

    angular
        .module('app.services')
        .factory('notificationService', ['$httpMock', '$rootScope', 'UtilService', 'API_URL', notificationService])

    function notificationService($httpMock, $rootScope, UtilService, API_URL) {
        return {
            triggerReviewNotif,
        };

        function triggerReviewNotif(id) {
            return $httpMock.get(API_URL + '/api/notification/testrun/' + id + '/review').then(UtilService.handleSuccess, UtilService.handleError('Unable to trigger review notif'));
        }
    }
})();

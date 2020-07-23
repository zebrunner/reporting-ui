(function () {
    'use strict';

    angular
        .module('app.services')
        .factory('notificationService', ['$httpMock', '$rootScope', 'UtilService', notificationService])

    function notificationService($httpMock, $rootScope, UtilService) {
        return {
            triggerReviewNotif,
        };

        function triggerReviewNotif(id) {
            return $httpMock.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/notification/testrun/${id}/review`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to trigger review notification'));
        }
    }
})();

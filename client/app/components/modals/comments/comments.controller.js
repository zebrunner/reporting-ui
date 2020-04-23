(function () {
    'use strict';

    angular.module('app').controller('CommentsController', CommentsController);

    function CommentsController(
        $mdDialog,
        $scope,
        isNotificationAvailable,
        messageService,
        notificationService,
        testRun,
        TestRunService,
    ) {
        'ngInject';

        $scope.title = testRun.testSuite.name;
        $scope.testRun = angular.copy(testRun);

        $scope.markReviewed = function(){
            const params = {
                comment: $scope.testRun.comments || '',
            };

            TestRunService.markTestRunAsReviewed($scope.testRun.id, params)
                .then(rs => {
                    if (rs.success) {
                        $scope.testRun.reviewed = true;
                        messageService.success('Test run #' + $scope.testRun.id + ' marked as reviewed');
                        if (isNotificationAvailable && $scope.testRun.channels) {
                            if (confirm('Would you like to post latest test run status to notificationService?')) {
                                notificationService.triggerReviewNotif($scope.testRun.id);
                            }
                        }
                        $scope.hide($scope.testRun);
                    } else {
                        messageService.error(rs.message);
                    }
                });
        };
        $scope.hide = function(testRun) {
            $mdDialog.hide(testRun);
        };
        $scope.cancel = function() {
            $mdDialog.cancel();
        };
    }

})();

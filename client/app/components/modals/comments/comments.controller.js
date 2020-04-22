(function () {
    'use strict';

    angular.module('app').controller('CommentsController', CommentsController);

    function CommentsController($scope, $mdDialog, TestRunService, notificationService, testRun, toolsService, messageService) {
        'ngInject';

        $scope.title = testRun.testSuite.name;
        $scope.testRun = angular.copy(testRun);

        $scope.markReviewed = function(){
            var rq = {};

            rq.comment = $scope.testRun.comments || '';
            TestRunService.markTestRunAsReviewed($scope.testRun.id, rq).then(function(rs) {
                if(rs.success) {
                    $scope.testRun.reviewed = true;
                    $scope.hide($scope.testRun);
                    messageService.success('Test run #' + $scope.testRun.id + ' marked as reviewed');
                    if (toolsService.isToolConnected('NOTIFICATION_SERVICE') && $scope.testRun.channels) {
                        if (confirm("Would you like to post latest test run status to notificationService?")) {
                            notificationService.triggerReviewNotif($scope.testRun.id);
                        }
                    }
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

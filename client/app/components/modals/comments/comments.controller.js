(function () {
    'use strict';

    angular.module('app').controller('CommentsController', CommentsController);

    function CommentsController($scope, $mdDialog, TestRunService, SlackService, testRun, toolsService, messageService) {
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
                    if (toolsService.isToolConnected('SLACK') && $scope.testRun.slackChannels) {
                        if (confirm("Would you like to post latest test run status to slack?")) {
                            SlackService.triggerReviewNotif($scope.testRun.id);
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

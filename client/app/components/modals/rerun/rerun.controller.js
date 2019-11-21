(function () {
    'use strict';

    angular.module('app').controller('TestRunRerunController', TestRunRerunController);

    function TestRunRerunController($scope, $mdDialog, TestRunService, testRun, toolsService, messageService) {
        'ngInject';

        $scope.testRun = testRun;
        $scope.rerunFailures = !!$scope.testRun.failed;

        Object.defineProperty($scope, 'displayFailuresOption', {
            get: () => !!$scope.testRun.failed,
        });
        Object.defineProperty($scope, 'displayAllOption', {
            get: () => !!($scope.testRun.skipped + $scope.testRun.passed + $scope.testRun.aborted + $scope.testRun.queued),
        });

        $scope.rebuild = function (testRun, rerunFailures) {
            if (toolsService.isToolConnected('JENKINS')) {
                TestRunService.rerunTestRun(testRun.id, rerunFailures)
                    .then(function(rs) {
                        if (rs.success) {
                            testRun.status = 'IN_PROGRESS';
                            messageService.success("Rebuild triggered in CI service");
                        } else {
                            messageService.error(rs.message);
                        }
                    });
            } else {
                window.open(testRun.jenkinsURL + '/rebuild/parameterized', '_blank');
            }

            $scope.hide(true);
        };

        $scope.hide = function() {
            $mdDialog.hide();
        };
        $scope.cancel = function() {
            $mdDialog.cancel();
        };
    }

})();

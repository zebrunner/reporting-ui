(function () {
    'use strict';

    angular.module('app').controller('EmailController', EmailController);

    function EmailController($scope, $mdDialog, $mdConstant, UserService, TestRunService, testRuns, messageService, UtilService) {
        'ngInject';

        let currentText;
        let stopCriteria = '########';
        $scope.email = {};
        $scope.email.recipients = [];
        $scope.users = [];
        $scope.keys = [$mdConstant.KEY_CODE.ENTER, $mdConstant.KEY_CODE.TAB, $mdConstant.KEY_CODE.COMMA, $mdConstant.KEY_CODE.SPACE, $mdConstant.KEY_CODE.SEMICOLON];
        $scope.usersSearchCriteria = {};

        $scope.UtilService = UtilService;
        $scope.querySearch = querySearch;
        $scope.checkAndTransformRecipient = checkAndTransformRecipient;
        $scope.sendEmail = sendEmail;

        function sendEmail() {
            $scope.hide();
            $scope.email.recipients = $scope.email.recipients.toString();
            testRuns.forEach(function(testRun) {
                TestRunService.sendTestRunResultsEmail(testRun.id, $scope.email).then(function(rs) {
                    if(rs.success)
                    {
                        messageService.success('Email was successfully sent!');
                    }
                    else
                    {
                        messageService.error(rs.message);
                    }
                });
            });
        }

        function querySearch(criteria, alreadyAddedUsers) {
            $scope.usersSearchCriteria.query = criteria;
            currentText = criteria;
            if (!criteria.includes(stopCriteria)) {
                stopCriteria = '########';

                return UserService.searchUsersWithQuery($scope.usersSearchCriteria, criteria).then(function (rs) {
                    if (rs.success) {
                        if (!rs.data.results.length) {
                            stopCriteria = criteria;
                        }

                        return UtilService.filterUsersForSend(rs.data.results, alreadyAddedUsers);;
                    }
                });
            }

            return "";
        }
    
        function checkAndTransformRecipient(currentUser) {
            currentText = '';
    
            return UtilService.checkAndTransformRecipient(currentUser, $scope.email.recipients, $scope.users);
        }

        $scope.hide = function() {
            $mdDialog.hide();
        };
        $scope.cancel = function() {
            $mdDialog.cancel();
        };
    }

})();

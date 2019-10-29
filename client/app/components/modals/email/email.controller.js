(function () {
    'use strict';

    angular.module('app').controller('EmailController', EmailController);

    function EmailController($scope, $mdDialog, $mdConstant, UserService, TestRunService, testRuns, messageService) {
        'ngInject';

        $scope.email = {};
        $scope.email.recipients = [];
        $scope.users = [];
        $scope.keys = [$mdConstant.KEY_CODE.ENTER, $mdConstant.KEY_CODE.TAB, $mdConstant.KEY_CODE.COMMA, $mdConstant.KEY_CODE.SPACE, $mdConstant.KEY_CODE.SEMICOLON];

        $scope.sendEmail = function () {
            if($scope.users.length == 0) {
                messageService.error('Add a recipient!')
                return;
            }
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
        };
        $scope.users_all = [];
        var currentText;

        $scope.usersSearchCriteria = {};
        $scope.asyncContacts = [];
        $scope.filterSelected = true;

        $scope.querySearch = querySearch;
        var stopCriteria = '########';

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
                        return filterUsersForSend(rs.data.results, alreadyAddedUsers);
                    }
                });
            }
            return "";
        }

        function isValidRecipient(recipient) {
            let reg = /^[_a-z0-9]+(\.[_a-z0-9]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$/;
            let isDuplicated = $scope.users.find((user) => user.email === recipient);
    
            return (reg.test(recipient) && !isDuplicated);
        }

        function filterUsersForSend(usersFromDB, alreadyAddedUsers) {
            return usersFromDB.filter((userFromDB) => {
                return !alreadyAddedUsers.find((addedUser) => {
                    return addedUser.id === userFromDB.id;
                }) && userFromDB.email;
            })
        }
    
        $scope.checkAndTransformRecipient = function (currentUser) {
            let user = {};
    
            if (typeof currentUser === 'object' && currentUser.email) {
                user = currentUser;
            } else {
                if (!isValidRecipient(currentUser)) {
                    messageService.error('Invalid email');
    
                    return null;
                }
                user.email = currentUser;
            }
    
            $scope.email.recipients.push(user.email);
            $scope.users.push(user);
            currentText = '';
    
            return user;
        };

        $scope.removeRecipient = function (user) {
            var index = $scope.email.recipients.indexOf(user.email);
            if (index >= 0) {
                $scope.email.recipients.splice(index, 1);
            }
        };
        $scope.hide = function() {
            $mdDialog.hide();
        };
        $scope.cancel = function() {
            $mdDialog.cancel();
        };
        // (function initController() {
        //
        // })();
    }

})();

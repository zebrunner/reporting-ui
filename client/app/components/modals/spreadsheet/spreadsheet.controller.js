(function () {
    'use strict';

    angular.module('app').controller('SpreadsheetController', SpreadsheetController);

    function SpreadsheetController(
        $q,
        $mdDialog,
        $mdConstant,
        UserService,
        TestRunService,
        testRuns,
        messageService,
        UtilService
        ) {
        'ngInject';

        let stopCriteria = '########';
        let usersSearchCriteria = {};
        const vm = {
            UtilService,
            querySearch,
            keys: [$mdConstant.KEY_CODE.ENTER, $mdConstant.KEY_CODE.TAB, $mdConstant.KEY_CODE.COMMA, $mdConstant.KEY_CODE.SPACE, $mdConstant.KEY_CODE.SEMICOLON],
            recipients: [],
            searchText: '',
            currentUser: null,
            cancel,
            users: [],
            clearInputOnSelect,
            createSpreadsheet,
        }

        function clearInputOnSelect() {
            vm.searchText = '';
            vm.currentUser = null;
        }

        function createSpreadsheet() {
            const links = [];
            let errorMessage = '';
            
            vm.recipients = vm.recipients.toString();
            vm.sendingEmail = true;

            const promises = testRuns.map(function(testRun) {
                return TestRunService.createTestRunResultsSpreadsheet(testRun.id, vm.recipients)
                    .then(function(rs) {
                        if (rs.success) {
                            links.push(rs.data);
                        } else {
                            !errorMessage && (errorMessage = rs.message);
    
                            return $q.reject();
                        }
                    });
            });

            $q.all(promises)
                .then(() => {
                    console.log(1111)
                    vm.sendingEmail = false;
                    // messageService.success('Email was successfully sent!');
                    hide(links);
                })
                .catch(() => {
                    console.log(222)
                    vm.sendingEmail = false;
                    if (errorMessage) {
                        messageService.error(errorMessage);
                    }
                });
        };

        function querySearch() {
            usersSearchCriteria.query = vm.searchText;
            if (!vm.searchText.includes(stopCriteria)) {
                stopCriteria = '########';
    
                return UserService.searchUsersWithQuery(usersSearchCriteria, vm.searchText)
                    .then(function (rs) {
                        if (rs.success) {
                            if (!rs.data.results.length) {
                                stopCriteria = vm.searchText;
                            }
    
                            return UtilService.filterUsersForSend(rs.data.results, vm.users);
                        }
                    });
            }
    
            return "";
        }

        function hide(data) {
            $mdDialog.hide(data);
        };

        function cancel() {
            $mdDialog.cancel();
        };

        return vm;
    }

})();

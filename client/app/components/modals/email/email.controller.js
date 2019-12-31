(function () {
    'use strict';

    angular.module('app').controller('EmailController', EmailController);

    function EmailController(
        $mdDialog,
        $mdConstant,
        UserService,
        TestRunService,
        testRuns,
        messageService,
        UtilService,
        $q
        ) {
        'ngInject';


        let stopCriteria = '########';
        let usersSearchCriteria = {};
        const vm = {
            UtilService,
            querySearch,
            sendEmail,
            clearInputOnSelect,
            keys: [$mdConstant.KEY_CODE.ENTER, $mdConstant.KEY_CODE.TAB, $mdConstant.KEY_CODE.COMMA, $mdConstant.KEY_CODE.SPACE, $mdConstant.KEY_CODE.SEMICOLON],
            email: {
                recipients: []
            },
            searchText: '',
            currentUser: null,
            cancel,
            users: [],
        };

        function sendEmail() {
            const email = {...vm.email};
            let errorMessage = '';
            let promises;

            email.recipients = email.recipients.toString();
            vm.sendingEmail = true;
            promises = testRuns.map(function(testRun) {
                return TestRunService.sendTestRunResultsEmail(testRun.id, email)
                    .then(function(rs) {
                        if (!rs.success) {
                            !errorMessage && (errorMessage = rs.message);

                            return $q.reject();
                        }
                    });
            });

            $q.all(promises)
                .then(() => {
                    vm.sendingEmail = false;
                    messageService.success('Email was successfully sent!');
                    hide();
                })
                .catch(() => {
                    vm.sendingEmail = false;
                    if (errorMessage) {
                        messageService.error(errorMessage);
                    } else {
                        messageService.error('Unable to send email');
                    }
                });
        }

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

        function clearInputOnSelect() {
            vm.searchText = '';
            vm.currentUser = null;
        }

        function hide() {
            $mdDialog.hide();
        };
        function cancel() {
            $mdDialog.cancel();
        };

        return vm;
    }

})();

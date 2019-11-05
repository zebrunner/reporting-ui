'use strict';

const dashboardEmailModalController = function dashboardEmailModalController($q, $screenshot, $mdDialog, $mdConstant, DashboardService, UserService, model, messageService, UtilService) {
    'ngInject';

    const vm = {
        cancel,
        hide,
        UtilService,
        users: [],
        querySearch,
        submit,
        keys: [$mdConstant.KEY_CODE.ENTER, $mdConstant.KEY_CODE.TAB, $mdConstant.KEY_CODE.COMMA, $mdConstant.KEY_CODE.SEMICOLON, $mdConstant.KEY_CODE.SPACE],
        usersSearchCriteria: {},
        currentText: '',
        stopCriteria: '########',
        title: model.title,
        email: {
            subject: model.title,
            text: "This is auto-generated email, please do not reply!",
            hostname: document.location.hostname,
            urls: [document.location.href],
            recipients: []
        }
    }

    function submit() {
        sendEmail(model.locator, angular.copy(vm.email)).then(function () {
            vm.hide();
        });
    };

    function sendEmail(locator, email) {
       email.recipients =  email.recipients.toString();
       
        return $screenshot.take(locator).then(function (multipart) {
            return DashboardService.SendDashboardByEmail(multipart, email).then(function (rs) {
                if (rs.success) {
                    messageService.success('Email was successfully sent!');
                }
                else {
                    messageService.error(rs.message);
                }
            });
        });
    };

    function querySearch(criteria, alreadyAddedUsers) {
        vm.usersSearchCriteria.query = criteria;
        vm.currentText = criteria;
        if (!criteria.includes(vm.stopCriteria)) {
            vm.stopCriteria = '########';

            return UserService.searchUsersWithQuery(vm.usersSearchCriteria, criteria).then(function (rs) {
                if (rs.success) {
                    if (!rs.data.results.length) {
                        vm.stopCriteria = criteria;
                    }

                    return UtilService.filterUsersForSend(rs.data.results, alreadyAddedUsers);
                }
            });
        }

        return "";
    }

    function hide() {
        $mdDialog.hide();
    };
    function cancel() {
        $mdDialog.cancel();
    };

    return vm;
};

export default dashboardEmailModalController;

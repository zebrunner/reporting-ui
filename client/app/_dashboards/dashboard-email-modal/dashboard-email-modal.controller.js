'use strict';

const dashboardEmailModalController = function dashboardEmailModalController(
    $filter,
    $screenshot,
    $mdDialog,
    $mdConstant,
    DashboardService,
    UserService,
    model,
    messageService,
    UtilService
    ) {
    'ngInject';

    const vm = {
        cancel,
        UtilService,
        users: [],
        querySearch,
        sendEmail,
        clearInputOnSelect,
        keys: [$mdConstant.KEY_CODE.ENTER, $mdConstant.KEY_CODE.TAB, $mdConstant.KEY_CODE.COMMA, $mdConstant.KEY_CODE.SEMICOLON, $mdConstant.KEY_CODE.SPACE],
        email: {
            subject: model.title,
            text: "This is auto-generated email, please do not reply!",
            hostname: document.location.hostname,
            urls: [document.location.href],
            recipients: []
        },
        searchText: '',
        currentUser: null,
    }
    let stopCriteria = '########';
    let usersSearchCriteria = {};

    function clearInputOnSelect() {
        vm.searchText = '';
        vm.currentUser = null;
    }

    function sendEmail() {
        let email = angular.copy(vm.email);
        const imgName = email.subject + ' - ' + $filter('date')(new Date(), 'MM:dd:yyyy');

        email.recipients = email.recipients.toString();
        vm.sendingEmail = true;

        return $screenshot.take(model.locator, imgName)
            .then(function (multipart) {
                return DashboardService.SendDashboardByEmail(multipart, email)
                    .then(function (rs) {
                        vm.sendingEmail = false;
                        if (rs.success) {
                            messageService.success('Email was successfully sent!');
                            hide();
                        }
                        else {
                            messageService.error(rs.message);
                        }
                    });
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
                    } else {
                        return "";
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

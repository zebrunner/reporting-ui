'use strict';

const dashboardEmailModalController = function dashboardEmailModalController($scope, $q, $screenshot, $mdDialog, $mdConstant, DashboardService, UserService, widgetId, messageService, UtilService) {
    'ngInject';

    let TYPE = widgetId ? 'WIDGET' : 'DASHBOARD';
    let CURRENT_DASHBOARD_TITLE = angular.element('#dashboard_title')[0].value + ' dashboard';
    let CURRENT_WIDGET_TITLE = TYPE === 'WIDGET' ? CURRENT_DASHBOARD_TITLE + ' - ' + angular.element('#widget-title-' + widgetId)[0].value + ' widget' : '';
    let EMAIL_TYPES = {
        'DASHBOARD': {
            title: CURRENT_DASHBOARD_TITLE,
            subject: CURRENT_DASHBOARD_TITLE,
            locator: '#dashboard_content'
        },
        'WIDGET': {
            title: CURRENT_WIDGET_TITLE,
            subject: CURRENT_WIDGET_TITLE,
            locator: '#widget-container-' + widgetId
        }
    };
    let currentText;
    let stopCriteria = '########';

    $scope.UtilService = UtilService;
    $scope.title = EMAIL_TYPES[TYPE].title;
    $scope.email = {
        subject: EMAIL_TYPES[TYPE].subject,
        text: "This is auto-generated email, please do not reply!",
        hostname: document.location.hostname,
        urls: [document.location.href],
        recipients: []
    };
    $scope.users = [];
    $scope.keys = [$mdConstant.KEY_CODE.ENTER, $mdConstant.KEY_CODE.TAB, $mdConstant.KEY_CODE.COMMA, $mdConstant.KEY_CODE.SEMICOLON, $mdConstant.KEY_CODE.SPACE];
    $scope.usersSearchCriteria = {};

    $scope.querySearch = querySearch;
    $scope.submit = submit;
    $scope.checkAndTransformRecipient = checkAndTransformRecipient;


    function submit() {
        if (UtilService.prepareEmails(currentText, $scope.users, $scope.email.recipients)) {
            sendEmail(EMAIL_TYPES[TYPE].locator, angular.copy($scope.email)).then(function () {
                $scope.hide();
            });
        }
    };

    function sendEmail(locator, email) {
       email.recipients =  email.recipients.toString();
       
        return $q(function (resolve, reject) {
            const imgName = email.subject + ' - ' + $filter('date')(new Date(), 'MM:dd:yyyy');
            $screenshot.take(locator, imgName).then(function (multipart) {
                DashboardService.SendDashboardByEmail(multipart, email).then(function (rs) {
                    if (rs.success) {
                        messageService.success('Email was successfully sent!');
                    }
                    else {
                        messageService.error(rs.message);
                    }
                    resolve(rs);
                });
            });
        });
    };

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

                    return UtilService.filterUsersForSend(rs.data.results, alreadyAddedUsers);
                }
            });
        }

        return "";
    }    

    function checkAndTransformRecipient(currentUser) {
        currentText = '';

        return UtilService.checkAndTransformRecipient(currentUser, $scope.email.recipients, $scope.users);
    }

    $scope.hide = function () {
        $mdDialog.hide();
    };
    $scope.cancel = function () {
        $mdDialog.cancel();
    };
};

export default dashboardEmailModalController;

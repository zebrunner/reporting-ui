'use strict';

const dashboardEmailModalController = function dashboardEmailModalController($scope, $q, $screenshot, $mdDialog, $mdConstant, DashboardService, UserService, widgetId, messageService) {
    'ngInject';

    var TYPE = widgetId ? 'WIDGET' : 'DASHBOARD';

    var CURRENT_DASHBOARD_TITLE = angular.element('#dashboard_title')[0].value + ' dashboard';
    var CURRENT_WIDGET_TITLE = TYPE === 'WIDGET' ? CURRENT_DASHBOARD_TITLE + ' - ' + angular.element('#widget-title-' + widgetId)[0].value + ' widget' : '';

    var EMAIL_TYPES = {
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

    $scope.title = EMAIL_TYPES[TYPE].title;
    $scope.subjectRequired = true;
    $scope.textRequired = true;

    $scope.email = {
        subject: EMAIL_TYPES[TYPE].subject,
        text: "This is auto-generated email, please do not reply!",
        hostname: document.location.hostname,
        urls: [document.location.href],
        recipients: []
    };
    $scope.users = [];
    $scope.keys = [$mdConstant.KEY_CODE.ENTER, $mdConstant.KEY_CODE.TAB, $mdConstant.KEY_CODE.COMMA, $mdConstant.KEY_CODE.SEMICOLON, $mdConstant.KEY_CODE.SPACE];

    $scope.sendEmail = function () {
        if (! $scope.users.length) {
            if (currentText && currentText.length) {
                $scope.email.recipients.push(currentText);
            } else {
                messageService.error('Add a recipient!');
                return;
            }
        }
        sendEmail(EMAIL_TYPES[TYPE].locator, angular.copy($scope.email)).then(function () {
            $scope.hide();
        });
    };

    function isValidRecipient(recipient) {
        let reg = /^[_a-z0-9]+(\.[_a-z0-9]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$/;
        
        return (reg.test(recipient));
    }

    function sendEmail(locator, email) {
       email.recipients =  email.recipients.toString();
        return $q(function (resolve, reject) {
            $screenshot.take(locator).then(function (multipart) {
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

    $scope.users_all = [];

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
                messageService.error('Invalid email format');

                return null;
            }
            user.email = currentUser;
        }

        $scope.email.recipients.push(user.email);
        $scope.users.push(user);

        return user;
    };

    $scope.removeRecipient = function (user) {
        var index = $scope.email.recipients.indexOf(user.email);
        if (index >= 0) {
            $scope.email.recipients.splice(index, 1);
        }
    };

    $scope.hide = function () {
        $mdDialog.hide();
    };
    $scope.cancel = function () {
        $mdDialog.cancel();
    };
    (function initController() {
    })();
};

export default dashboardEmailModalController;
